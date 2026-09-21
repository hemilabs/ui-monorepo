import {
  extraApprovalMultiplier,
  getApprovalAmount,
  getExtraApprovalAmount,
} from 'utils/approval'
import { describe, expect, it } from 'vitest'

describe('getExtraApprovalAmount', function () {
  it('returns undefined when the setting is off, so the action approves what it pulls', function () {
    expect(getExtraApprovalAmount(BigInt(100), false)).toBeUndefined()
  })

  it('multiplies the amount when the setting is on', function () {
    expect(getExtraApprovalAmount(BigInt(100), true)).toBe(
      BigInt(100 * extraApprovalMultiplier),
    )
  })

  // The copy spells the multiple out instead of interpolating it, so nothing but
  // this assertion keeps the label and the allowance requested in agreement.
  it('requests ten times the amount, which is what the copy says', function () {
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
