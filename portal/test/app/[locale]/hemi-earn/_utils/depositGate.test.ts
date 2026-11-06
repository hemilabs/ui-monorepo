import { describe, expect, it } from 'vitest'

import { resolveDepositGate } from '../../../../../app/[locale]/hemi-earn/_utils/depositGate'

describe('resolveDepositGate', function () {
  it('allows deposits into a listed vault when they are not paused', function () {
    expect(
      resolveDepositGate({ depositsPaused: false, isListed: true }),
    ).toStrictEqual({
      canDeposit: true,
      reason: undefined,
    })
  })

  it('blocks deposits with a reason when they are paused', function () {
    expect(
      resolveDepositGate({ depositsPaused: true, isListed: true }),
    ).toStrictEqual({
      canDeposit: false,
      reason: 'deposits-paused',
    })
  })

  it('blocks deposits into a delisted vault', function () {
    expect(
      resolveDepositGate({ depositsPaused: false, isListed: false }),
    ).toStrictEqual({
      canDeposit: false,
      reason: 'vault-delisted',
    })
  })

  it('reports the pause over the delisting when both apply', function () {
    expect(
      resolveDepositGate({ depositsPaused: true, isListed: false }),
    ).toStrictEqual({
      canDeposit: false,
      reason: 'deposits-paused',
    })
  })
})
