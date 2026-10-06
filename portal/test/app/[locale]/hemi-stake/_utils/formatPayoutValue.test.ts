import {
  formatPayoutDetail,
  formatPayoutValue,
} from 'app/[locale]/hemi-stake/_utils/formatPayoutValue'
import { describe, expect, it } from 'vitest'

const hemi = { symbol: 'HEMI' }

describe('formatPayoutValue', function () {
  it('renders the token amount with its symbol', function () {
    expect(formatPayoutValue({ ...hemi, value: 1764 })).toBe('1,764 HEMI')
  })

  it('keeps the decimals of a small payout', function () {
    expect(formatPayoutValue({ ...hemi, value: 0.003135 })).toBe(
      '0.003135 HEMI',
    )
  })

  it('groups a large payout', function () {
    expect(formatPayoutValue({ ...hemi, value: 1_234_567 })).toBe(
      '1,234,567 HEMI',
    )
  })
})

describe('formatPayoutDetail', function () {
  it('pairs the token amount with its fiat value', function () {
    expect(formatPayoutDetail({ ...hemi, price: 0.0065, value: 1764 })).toBe(
      '1,764 HEMI · $11.47',
    )
  })

  it('drops the fiat half when no price came back', function () {
    expect(formatPayoutDetail({ ...hemi, price: undefined, value: 1764 })).toBe(
      '1,764 HEMI',
    )
  })

  it('reads a zero price as a price, not as a missing one', function () {
    expect(formatPayoutDetail({ ...hemi, price: 0, value: 1764 })).toBe(
      '1,764 HEMI · $0.00',
    )
  })

  it('keeps the token amount readable when the fiat value is under a cent', function () {
    expect(formatPayoutDetail({ ...hemi, price: 0.00627, value: 0.5 })).toBe(
      '0.5 HEMI · < $0.01',
    )
  })
})
