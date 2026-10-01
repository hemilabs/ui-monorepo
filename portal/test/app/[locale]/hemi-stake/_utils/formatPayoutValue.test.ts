import { formatPayoutValue } from 'app/[locale]/hemi-stake/_utils/formatPayoutValue'
import { describe, expect, it } from 'vitest'

const hemi = { symbol: 'HEMI' }

describe('formatPayoutValue', function () {
  it('prices the payout in fiat when a price is known', function () {
    expect(formatPayoutValue({ ...hemi, price: 0.0065, value: 1764 })).toBe(
      '$11.466',
    )
  })

  it('falls back to the token amount when no price came back', function () {
    expect(formatPayoutValue({ ...hemi, price: undefined, value: 1764 })).toBe(
      '1,764 HEMI',
    )
  })

  it('keeps a small payout readable instead of rounding it to zero', function () {
    expect(formatPayoutValue({ ...hemi, price: 0.00627, value: 0.5 })).toBe(
      '$0.003135',
    )
  })

  it('reads a zero price as a price, not as a missing one', function () {
    expect(formatPayoutValue({ ...hemi, price: 0, value: 1764 })).toBe('$0.00')
  })

  it('groups a large payout', function () {
    expect(formatPayoutValue({ ...hemi, price: 1, value: 1_234_567 })).toBe(
      '$1,234,567.00',
    )
  })
})
