import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { describe, expect, it, vi } from 'vitest'

import {
  inTransitPostAction,
  isCrossingNetworks,
} from '../../../../../app/[locale]/hemi-earn/_utils/inTransit'

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
