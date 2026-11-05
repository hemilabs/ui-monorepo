import { describe, expect, it } from 'vitest'

import { resolveDepositGate } from '../../../../../app/[locale]/hemi-earn/_utils/depositGate'

describe('resolveDepositGate', function () {
  it('allows deposits when they are not paused', function () {
    expect(resolveDepositGate(false)).toStrictEqual({
      canDeposit: true,
      reason: undefined,
    })
  })

  it('blocks deposits with a reason when they are paused', function () {
    expect(resolveDepositGate(true)).toStrictEqual({
      canDeposit: false,
      reason: 'deposits-paused',
    })
  })
})
