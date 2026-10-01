import { formatPayoutValue } from 'app/[locale]/hemi-stake/_utils/formatPayoutValue'
import { describe, expect, it } from 'vitest'

const hemi = { locale: 'en', symbol: 'HEMI' }

describe('formatPayoutValue', function () {
  it('prices the payout in fiat when a price is known', function () {
    expect(
      formatPayoutValue({
        ...hemi,
        precision: 'full',
        price: 0.0065,
        value: 1764,
      }),
    ).toBe('$11.47')
  })

  it('falls back to the token amount when no price came back', function () {
    expect(formatPayoutValue({ ...hemi, precision: 'full', value: 1764 })).toBe(
      '1,764 HEMI',
    )
  })

  it('reads a zero price as a price, not as a missing one', function () {
    expect(
      formatPayoutValue({ ...hemi, precision: 'full', price: 0, value: 1764 }),
    ).toBe('$0.00')
  })

  it('shortens the number for an axis tick', function () {
    expect(
      formatPayoutValue({ ...hemi, price: 0.0065, value: 1_000_000 }),
    ).toBe('$6.5K')
  })

  it('shortens the token amount too, keeping the symbol', function () {
    expect(formatPayoutValue({ ...hemi, value: 1_764_000 })).toBe('1.76M HEMI')
  })

  it('formats compactly by default', function () {
    expect(formatPayoutValue({ ...hemi, value: 1_764_000 })).toBe(
      formatPayoutValue({ ...hemi, precision: 'compact', value: 1_764_000 }),
    )
  })
})
