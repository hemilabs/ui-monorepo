import { describe, expect, it } from 'vitest'

import {
  defaultDepositSlippage,
  defaultRedeemSlippage,
  maxSlippage,
  applySlippage,
} from '../../../../../app/[locale]/hemi-earn/_constants/slippage'
import { percentToBps } from '../../../../../app/[locale]/hemi-earn/_utils/slippage'

const depositBps = percentToBps(defaultDepositSlippage)
const redeemBps = percentToBps(defaultRedeemSlippage)

describe('applySlippage', function () {
  it('applies the default deposit slippage (0.5%)', function () {
    expect(depositBps).toBe(BigInt(50))
    // (10000 * 9950) / 10000 = 9950
    expect(applySlippage(BigInt(10000), depositBps)).toBe(BigInt(9950))
  })

  it('applies the default redeem slippage (1%)', function () {
    expect(redeemBps).toBe(BigInt(100))
    // (10000 * 9900) / 10000 = 9900
    expect(applySlippage(BigInt(10000), redeemBps)).toBe(BigInt(9900))
  })

  it('returns zero when amount is zero', function () {
    expect(applySlippage(BigInt(0), depositBps)).toBe(BigInt(0))
    expect(applySlippage(BigInt(0), redeemBps)).toBe(BigInt(0))
  })

  it('returns zero when amount is negative', function () {
    expect(applySlippage(BigInt(-100), depositBps)).toBe(BigInt(0))
  })

  it('clamps to 1n when amount > 0 but floor-division would yield 0', function () {
    // (1 * 9950) / 10000 = 0 → would disable slippage protection, clamp to 1
    expect(applySlippage(BigInt(1), depositBps)).toBe(BigInt(1))
    // (1 * 9900) / 10000 = 0 → clamp to 1
    expect(applySlippage(BigInt(1), redeemBps)).toBe(BigInt(1))
  })

  it('does not clamp once the result is naturally positive', function () {
    // (200 * 9950) / 10000 = 199 (no clamp needed)
    expect(applySlippage(BigInt(200), depositBps)).toBe(BigInt(199))
    // (100 * 9900) / 10000 = 99
    expect(applySlippage(BigInt(100), redeemBps)).toBe(BigInt(99))
  })

  it('returns amount unchanged when bps is 0', function () {
    expect(applySlippage(BigInt(1000), BigInt(0))).toBe(BigInt(1000))
  })

  it('rejects bps above BPS_DENOMINATOR', function () {
    expect(() => applySlippage(BigInt(1000), BigInt(10001))).toThrow(RangeError)
  })

  it('rejects negative bps', function () {
    expect(() => applySlippage(BigInt(1000), BigInt(-1))).toThrow(RangeError)
  })

  it('clamps to 1n at bps = BPS_DENOMINATOR (100% slippage)', function () {
    // (1000 * 0) / 10000 = 0 → clamp to 1
    expect(applySlippage(BigInt(1000), BigInt(10000))).toBe(BigInt(1))
  })

  // applySlippage throws outside [0, BPS_DENOMINATOR] and is now called during render
  // with a user-set value, so maxSlippage must never map past that ceiling.
  it('accepts the whole user-selectable range without throwing', function () {
    expect(() =>
      applySlippage(BigInt(1000), percentToBps(maxSlippage)),
    ).not.toThrow()
    expect(percentToBps(maxSlippage)).toBe(BigInt(10000))
    expect(() => applySlippage(BigInt(1000), percentToBps(0))).not.toThrow()
  })

  it('handles large bigint values without overflow', function () {
    const large = BigInt(10) ** BigInt(30)
    expect(applySlippage(large, depositBps)).toBe(
      (large * BigInt(9950)) / BigInt(10000),
    )
  })
})
