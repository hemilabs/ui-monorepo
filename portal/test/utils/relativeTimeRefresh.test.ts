import { getTimeoutInterval } from 'utils/relativeTimeRefresh'
import { describe, expect, it } from 'vitest'

const oneSecond = 1000
const oneMinute = 60 * oneSecond
const oneHour = 60 * oneMinute
const oneDay = 24 * oneHour

const now = new Date('2026-01-01T00:00:00Z').getTime()

const intervalIn = (millisecondsAway: number) =>
  getTimeoutInterval(now + millisecondsAway, now)

const intervalAgo = (millisecondsAway: number) =>
  getTimeoutInterval(now - millisecondsAway, now)

describe('utils/relativeTimeRefresh', function () {
  describe('getTimeoutInterval', function () {
    it('refreshes every second up to one minute away', function () {
      expect(intervalIn(0)).toBe(oneSecond)
      expect(intervalIn(30 * oneSecond)).toBe(oneSecond)
      expect(intervalIn(oneMinute)).toBe(oneSecond)
    })

    it('refreshes every 30 seconds up to ten minutes away', function () {
      expect(intervalIn(oneMinute + oneSecond)).toBe(30 * oneSecond)
      expect(intervalIn(5 * oneMinute)).toBe(30 * oneSecond)
      expect(intervalIn(10 * oneMinute)).toBe(30 * oneSecond)
    })

    it('refreshes every minute up to one hour away', function () {
      expect(intervalIn(10 * oneMinute + oneSecond)).toBe(oneMinute)
      expect(intervalIn(45 * oneMinute)).toBe(oneMinute)
      expect(intervalIn(oneHour)).toBe(oneMinute)
    })

    it('refreshes every hour from one hour up to two days away', function () {
      expect(intervalIn(oneHour + oneSecond)).toBe(oneHour)
      expect(intervalIn(oneDay)).toBe(oneHour)
      expect(intervalIn(2 * oneDay)).toBe(oneHour)
    })

    it('refreshes once a day beyond two days away', function () {
      expect(intervalIn(2 * oneDay + oneSecond)).toBe(oneDay)
      expect(intervalIn(150 * oneDay)).toBe(oneDay)
      expect(intervalIn(4 * 365 * oneDay)).toBe(oneDay)
    })

    it('treats past and future timestamps the same', function () {
      expect(intervalAgo(30 * oneSecond)).toBe(intervalIn(30 * oneSecond))
      expect(intervalAgo(5 * oneMinute)).toBe(intervalIn(5 * oneMinute))
      expect(intervalAgo(45 * oneMinute)).toBe(intervalIn(45 * oneMinute))
      expect(intervalAgo(oneDay)).toBe(intervalIn(oneDay))
      expect(intervalAgo(150 * oneDay)).toBe(intervalIn(150 * oneDay))
    })
  })
})
