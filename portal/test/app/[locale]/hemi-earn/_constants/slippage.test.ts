import { describe, expect, it } from 'vitest'

import {
  DEPOSIT_SLIPPAGE_BPS,
  REDEEM_SLIPPAGE_BPS,
  applySlippage,
} from '../../../../../app/[locale]/hemi-earn/_constants/slippage'

describe('applySlippage', function () {
  it('applies 0.5% slippage for typical deposit amounts', function () {
    // (10000 * 9950) / 10000 = 9950
    expect(applySlippage(BigInt(10000), DEPOSIT_SLIPPAGE_BPS)).toBe(
      BigInt(9950),
    )
  })

  it('applies 1.0% slippage for typical redeem amounts', function () {
    // (10000 * 9900) / 10000 = 9900
    expect(applySlippage(BigInt(10000), REDEEM_SLIPPAGE_BPS)).toBe(BigInt(9900))
  })

  it('returns zero when amount is zero', function () {
    expect(applySlippage(BigInt(0), DEPOSIT_SLIPPAGE_BPS)).toBe(BigInt(0))
    expect(applySlippage(BigInt(0), REDEEM_SLIPPAGE_BPS)).toBe(BigInt(0))
  })

  it('returns zero when amount is negative', function () {
    expect(applySlippage(BigInt(-100), DEPOSIT_SLIPPAGE_BPS)).toBe(BigInt(0))
  })

  it('clamps to 1n when amount > 0 but floor-division would yield 0', function () {
    // (1 * 9950) / 10000 = 0 → would disable slippage protection, clamp to 1
    expect(applySlippage(BigInt(1), DEPOSIT_SLIPPAGE_BPS)).toBe(BigInt(1))
    // (1 * 9900) / 10000 = 0 → clamp to 1
    expect(applySlippage(BigInt(1), REDEEM_SLIPPAGE_BPS)).toBe(BigInt(1))
  })

  it('does not clamp once the result is naturally positive', function () {
    // (200 * 9950) / 10000 = 199 (no clamp needed)
    expect(applySlippage(BigInt(200), DEPOSIT_SLIPPAGE_BPS)).toBe(BigInt(199))
    // (100 * 9900) / 10000 = 99
    expect(applySlippage(BigInt(100), REDEEM_SLIPPAGE_BPS)).toBe(BigInt(99))
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

  it('handles large bigint values without overflow', function () {
    const large = BigInt(10) ** BigInt(30)
    expect(applySlippage(large, DEPOSIT_SLIPPAGE_BPS)).toBe(
      (large * BigInt(9950)) / BigInt(10000),
    )
  })
})
