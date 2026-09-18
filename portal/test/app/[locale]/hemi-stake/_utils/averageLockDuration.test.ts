import { formatAverageLockDuration } from 'app/[locale]/hemi-stake/_utils/averageLockDuration'
import { describe, expect, it } from 'vitest'

const days = (amount: number) => amount * 60 * 60 * 24

describe('formatAverageLockDuration', function () {
  it('should use years from a full year up', function () {
    expect(formatAverageLockDuration(days(657.45), 'en')).toBe('1.8 years')
    expect(formatAverageLockDuration(days(365.25), 'en')).toBe('1 year')
  })

  it('should use months below a year', function () {
    expect(formatAverageLockDuration(days(182.625), 'en')).toBe('6 months')
    expect(formatAverageLockDuration(days(30.4375), 'en')).toBe('1 month')
  })

  it('should use weeks below a month', function () {
    expect(formatAverageLockDuration(days(21), 'en')).toBe('3 weeks')
  })

  it('should use days below a week', function () {
    expect(formatAverageLockDuration(days(6), 'en')).toBe('6 days')
    expect(formatAverageLockDuration(0, 'en')).toBe('0 days')
  })

  it('should follow the locale for the unit and the separator', function () {
    expect(formatAverageLockDuration(days(657.45), 'es')).toBe('1,8 años')
    expect(formatAverageLockDuration(days(182.625), 'pt')).toBe('6 meses')
  })
})
