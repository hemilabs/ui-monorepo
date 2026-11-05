import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { describe, expect, it, vi } from 'vitest'

import {
  inTransitPostAction,
  isCrossingNetworks,
  isOutboundPending,
  isTransferDelayed,
  transferDeadline,
} from '../../../../../app/[locale]/hemi-earn/_utils/inTransit'

import { baseTx } from './fixtures'

const t = vi.fn((key, values) => `${key}:${values.duration}`)

describe('inTransitPostAction', function () {
  it('describes the wait while the transfer is crossing', function () {
    expect(
      inTransitPostAction({ duration: '5 minutes', isCrossing: true, t }),
    ).toEqual({
      description: 'in-transit:5 minutes',
      status: ProgressStatus.NOT_READY,
    })
  })

  it('stays out of the ladder when nothing is crossing', function () {
    expect(
      inTransitPostAction({ duration: '5 minutes', isCrossing: false, t }),
    ).toBeUndefined()
  })

  it('says nothing rather than a blank duration when the vault is unknown', function () {
    expect(
      inTransitPostAction({ duration: undefined, isCrossing: true, t }),
    ).toBeUndefined()
  })
})

describe('isCrossingNetworks', function () {
  const crossing = {
    isRemoteFail: false,
    isSettlingLocally: false,
    isStepInProgress: true,
  }

  it('is crossing while the step runs and nothing else holds it', function () {
    expect(isCrossingNetworks(crossing)).toBe(true)
  })

  it('is not crossing before the step starts', function () {
    expect(isCrossingNetworks({ ...crossing, isStepInProgress: false })).toBe(
      false,
    )
  })

  it('is not crossing while the remote leg has failed', function () {
    expect(isCrossingNetworks({ ...crossing, isRemoteFail: true })).toBe(false)
  })

  it('is not crossing while a local settlement is mining', function () {
    expect(isCrossingNetworks({ ...crossing, isSettlingLocally: true })).toBe(
      false,
    )
  })

  it('is not crossing while the cooldown is the wait', function () {
    expect(isCrossingNetworks({ ...crossing, isAwaitingCooldown: true })).toBe(
      false,
    )
  })
})

describe('transferDeadline', function () {
  it('counts from the request while the outbound leg is in flight', function () {
    expect(
      transferDeadline({ maxTransferSeconds: 600, requestedAt: '1700000000' }),
    ).toBe(1700000600)
  })

  it('counts from processedAt on the return leg, past a redeem cooldown', function () {
    expect(
      transferDeadline({
        maxTransferSeconds: 600,
        processedAt: '1700600000',
        requestedAt: '1700000000',
      }),
    ).toBe(1700600600)
  })

  it('falls back to the request when the Agent has not processed it yet', function () {
    expect(
      transferDeadline({
        maxTransferSeconds: 600,
        processedAt: null,
        requestedAt: '1700000000',
      }),
    ).toBe(1700000600)
  })

  it('has no deadline before the request is indexed', function () {
    expect(
      transferDeadline({ maxTransferSeconds: 600, requestedAt: undefined }),
    ).toBeUndefined()
  })

  it('has no deadline when the vault is unknown', function () {
    expect(
      transferDeadline({
        maxTransferSeconds: undefined,
        requestedAt: '1700000000',
      }),
    ).toBeUndefined()
  })

  it('treats a zero or non-numeric timestamp as unknown, not as long expired', function () {
    expect(
      transferDeadline({ maxTransferSeconds: 600, requestedAt: '0' }),
    ).toBeUndefined()
    expect(
      transferDeadline({ maxTransferSeconds: 600, requestedAt: '' }),
    ).toBeUndefined()
    expect(
      transferDeadline({ maxTransferSeconds: 600, requestedAt: 'nope' }),
    ).toBeUndefined()
  })
})

describe('isTransferDelayed', function () {
  const delayed = {
    isCrossing: true,
    secondsRemaining: 0,
    transaction: baseTx,
  }

  it('is delayed once the window has run out while still crossing', function () {
    expect(isTransferDelayed(delayed)).toBe(true)
  })

  it('is not delayed while there is time left', function () {
    expect(isTransferDelayed({ ...delayed, secondsRemaining: 1 })).toBe(false)
  })

  it('is not delayed when the deadline is unknown', function () {
    expect(isTransferDelayed({ ...delayed, secondsRemaining: undefined })).toBe(
      false,
    )
  })

  it('is not delayed when nothing is crossing', function () {
    expect(isTransferDelayed({ ...delayed, isCrossing: false })).toBe(false)
  })

  it('stays quiet on a local row, whose timestamp is the client clock', function () {
    expect(
      isTransferDelayed({
        ...delayed,
        transaction: { ...baseTx, requestId: 'local-123' },
      }),
    ).toBe(false)
  })

  it('stays quiet on a cancel the user asked for', function () {
    expect(
      isTransferDelayed({
        ...delayed,
        transaction: { ...baseTx, cancellationRequested: true },
      }),
    ).toBe(false)
  })

  it('stays quiet on the recover path, which has its own banner', function () {
    expect(
      isTransferDelayed({
        ...delayed,
        transaction: { ...baseTx, status: 'CANCELLED' },
      }),
    ).toBe(false)
    expect(
      isTransferDelayed({
        ...delayed,
        transaction: { ...baseTx, status: 'RECOVERED' },
      }),
    ).toBe(false)
  })
})

describe('isOutboundPending', function () {
  const outbound = {
    ...baseTx,
    claimableAt: null,
    kind: 'REDEEM' as const,
    processedAt: null,
    status: 'PENDING' as const,
  }

  it('is outbound while the Agent has neither received nor processed it', function () {
    // Regression: a cooldown redeem leaves the receive step NOT_READY on this leg,
    // so the delay banner never fired for the whole Hemi to Ethereum crossing.
    expect(isOutboundPending(outbound)).toBe(true)
  })

  it('is not outbound once the cooldown deadline is known', function () {
    expect(isOutboundPending({ ...outbound, claimableAt: '1700000000' })).toBe(
      false,
    )
  })

  it('is not outbound once the Agent processed it', function () {
    expect(isOutboundPending({ ...outbound, processedAt: '1700000000' })).toBe(
      false,
    )
  })

  it('is not outbound on a row that is not PENDING', function () {
    expect(isOutboundPending({ ...outbound, status: 'FINALIZED' })).toBe(false)
  })

  it('is not outbound on a local row, which the indexer has not seen', function () {
    expect(isOutboundPending({ ...outbound, requestId: 'local-1' })).toBe(false)
  })
})
