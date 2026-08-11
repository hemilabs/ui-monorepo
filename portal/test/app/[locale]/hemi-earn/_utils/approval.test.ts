import { describe, expect, it } from 'vitest'

import {
  extraApprovalMultiplier,
  getApprovalAmount,
  getExtraApprovalAmount,
} from '../../../../../app/[locale]/hemi-earn/_utils/approval'

describe('getExtraApprovalAmount', function () {
  it('returns undefined when the setting is off, so the action approves what it pulls', function () {
    expect(getExtraApprovalAmount(BigInt(100), false)).toBeUndefined()
  })

  it('multiplies the amount when the setting is on', function () {
    expect(getExtraApprovalAmount(BigInt(100), true)).toBe(
      BigInt(100 * extraApprovalMultiplier),
    )
  })

  // The panel copy interpolates the same constant, so the label can't drift from
  // the allowance actually requested.
  it('exposes a multiplier the copy can interpolate', function () {
    expect(extraApprovalMultiplier).toBe(10)
  })

  it('returns undefined for a zero amount', function () {
    expect(getExtraApprovalAmount(BigInt(0), true)).toBeUndefined()
  })
})

describe('getApprovalAmount', function () {
  it('falls back to the amount when there is no extra allowance to request', function () {
    expect(getApprovalAmount(BigInt(0), true)).toBe(BigInt(0))
  })

  it('falls back to the operation amount when the setting is off', function () {
    expect(getApprovalAmount(BigInt(100), false)).toBe(BigInt(100))
  })

  it('matches the extra amount when the setting is on', function () {
    expect(getApprovalAmount(BigInt(100), true)).toBe(
      getExtraApprovalAmount(BigInt(100), true),
    )
  })
})
