import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { getPeriodDates, isPeriod } from '../src/periods.ts'

beforeAll(function () {
  vi.useFakeTimers()
  vi.setSystemTime(Date.parse('2026-09-11T12:00:00Z'))
})

afterAll(function () {
  vi.useRealTimers()
})

describe('getPeriodDates', function () {
  it.each([
    ['1w', '2026-09-04'],
    ['1m', '2026-08-12'],
    ['3m', '2026-06-13'],
    ['6m', '2026-03-15'],
    ['1y', '2025-09-11'],
  ])('answers the days of the %s period', function (period, firstDate) {
    expect(getPeriodDates(period)).toEqual({
      firstDate,
      lastDate: '2026-09-10',
    })
  })
})

describe('isPeriod', function () {
  it.each(['1w', '1m', '3m', '6m', '1y'])(
    'answers true for %s',
    function (period) {
      expect(isPeriod(period)).toBe(true)
    },
  )

  it.each([
    ['a period that does not exist', '2y'],
    ['an empty string', ''],
    ['a period in another case', '1W'],
    ['a padded period', ' 1m'],
    ['a property of the prototype', 'toString'],
    ['the constructor', 'constructor'],
  ])('answers false for %s', function (_, period) {
    expect(isPeriod(period)).toBe(false)
  })
})
