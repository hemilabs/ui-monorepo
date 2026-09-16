import { formatSupplyValue } from 'app/[locale]/hemi-stake/analytics/_utils/formatSupplyValue'
import { describe, expect, it } from 'vitest'

const locale = 'en'
const symbol = 'HEMI'

describe('formatSupplyValue', function () {
  it('should append the token symbol in token mode', function () {
    expect(
      formatSupplyValue({ locale, symbol, unit: 'hemi', value: 1_500_000 }),
    ).toContain('HEMI')
  })

  it('should prefix with the dollar sign in usd mode', function () {
    expect(
      formatSupplyValue({ locale, symbol, unit: 'usd', value: 1_500_000 }),
    ).toMatch(/^\$/)
  })

  it('should keep the sign ahead of the currency symbol', function () {
    expect(
      formatSupplyValue({ locale, symbol, unit: 'usd', value: -1_500_000 }),
    ).toMatch(/^-\$/)
  })
})
