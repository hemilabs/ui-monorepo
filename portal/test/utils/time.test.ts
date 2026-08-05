import {
  secondsToDaysAndHours,
  secondsToHours,
  secondsToWholeDays,
} from 'utils/time'
import { describe, expect, it } from 'vitest'

describe('utils/time', function () {
  describe('secondsToHours', function () {
    it('should convert seconds to hours correctly', function () {
      const result = secondsToHours(43200)
      expect(result).toBe(12)
    })
  })

  describe('secondsToDaysAndHours', function () {
    it('should break down days and hours flooring both', function () {
      expect(secondsToDaysAndHours(6 * 86400 + 23 * 3600)).toEqual({
        days: 6,
        hours: 23,
      })
    })

    it('should return zero hours on an exact day boundary', function () {
      expect(secondsToDaysAndHours(7 * 86400)).toEqual({ days: 7, hours: 0 })
    })

    it('should return zero days when under a day', function () {
      expect(secondsToDaysAndHours(5 * 3600)).toEqual({ days: 0, hours: 5 })
    })

    it('should return zeros for zero seconds', function () {
      expect(secondsToDaysAndHours(0)).toEqual({ days: 0, hours: 0 })
    })
  })

  describe('secondsToWholeDays', function () {
    it('should return the exact day count when seconds is a whole-day multiple', function () {
      expect(secondsToWholeDays(7 * 86400)).toBe(7)
    })

    it('should round up when the fractional part is >= 0.5 day', function () {
      expect(secondsToWholeDays(7 * 86400 + 43200)).toBe(8)
    })

    it('should round down when the fractional part is < 0.5 day', function () {
      expect(secondsToWholeDays(7 * 86400 + 43199)).toBe(7)
    })

    it('should return 0 for zero seconds', function () {
      expect(secondsToWholeDays(0)).toBe(0)
    })
  })
})
