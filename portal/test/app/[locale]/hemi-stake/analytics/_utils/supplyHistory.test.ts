import {
  getSupplySummary,
  parseSupplyPoints,
  sliceByPeriod,
  toChartSeries,
} from 'app/[locale]/hemi-stake/analytics/_utils/supplyHistory'
import { parseUnits } from 'viem'
import { describe, expect, it } from 'vitest'

const wei = (amount: number) => parseUnits(String(amount), 18).toString()

const rawFirst = {
  circulating: wei(1),
  date: '2026-01-01',
  nonCirculating: wei(7),
  priceUsd: '2',
  staked: wei(2),
  totalSupply: wei(10),
}

const rawLast = {
  circulating: wei(3),
  date: '2026-01-02',
  nonCirculating: wei(3),
  priceUsd: '5',
  staked: wei(4),
  totalSupply: wei(10),
}

const points = parseSupplyPoints([rawFirst, rawLast], 18)

const dayApart = (days: number) => ({
  circulating: 1,
  nonCirculating: 7,
  priceUsd: 2,
  staked: 2,
  timestamp: Date.UTC(2026, 1, 1) + days * 24 * 60 * 60 * 1000,
  totalSupply: 10,
})

describe('parseSupplyPoints', function () {
  it('should turn wei strings into token amounts', function () {
    expect(points[0].circulating).toBe(1)
    expect(points[0].totalSupply).toBe(10)
  })

  it('should turn the date into a timestamp', function () {
    expect(points[0].timestamp).toBe(Date.UTC(2026, 0, 1))
  })

  it('should accept a full timestamp as the date', function () {
    const [parsed] = parseSupplyPoints(
      [{ ...rawFirst, date: '2026-01-01T12:34:56.000Z' }],
      18,
    )

    expect(parsed.timestamp).toBe(Date.UTC(2026, 0, 1))
  })

  it('should throw on a date it cannot read', function () {
    expect(() =>
      parseSupplyPoints([{ ...rawFirst, date: 'yesterday' }], 18),
    ).toThrow()
  })

  it('should throw on a price that is not a finite number', function () {
    expect(() =>
      parseSupplyPoints([{ ...rawFirst, priceUsd: 'not-a-number' }], 18),
    ).toThrow()
    expect(() =>
      parseSupplyPoints([{ ...rawFirst, priceUsd: 'Infinity' }], 18),
    ).toThrow()
  })

  it('should throw on an amount it cannot read', function () {
    expect(() =>
      parseSupplyPoints([{ ...rawFirst, circulating: '1.4e27' }], 18),
    ).toThrow()
  })
})

describe('sliceByPeriod', function () {
  it('should window by date rather than by how many points there are', function () {
    const twicePerDay = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7].map(
      dayApart,
    )

    // eight days of points, but only the last seven days belong to the window
    expect(sliceByPeriod(twicePerDay, '1w')).toHaveLength(14)
  })

  it('should drop points older than the window', function () {
    const sparse = [0, 20, 40, 60].map(dayApart)

    expect(sliceByPeriod(sparse, '1m')).toHaveLength(2)
  })

  it('should return everything when the history is shorter than the period', function () {
    expect(sliceByPeriod(points, '3m')).toHaveLength(2)
  })
})

describe('toChartSeries', function () {
  it('should return token amounts for each slice', function () {
    const series = toChartSeries({ points, unit: 'hemi' })

    expect(series!.circulating.map(point => point.y)).toEqual([1, 3])
    expect(series!.staked.map(point => point.y)).toEqual([2, 4])
    expect(series!.nonCirculating.map(point => point.y)).toEqual([7, 3])
  })

  it("should price each day with that day's price, not the latest one", function () {
    const series = toChartSeries({ points, unit: 'usd' })

    expect(series!.circulating.map(point => point.y)).toEqual([2, 15])
  })

  it('should keep the slices adding up to the total supply', function () {
    const series = toChartSeries({ points, unit: 'hemi' })

    points.forEach((_, index) =>
      expect(
        series!.circulating[index].y +
          series!.staked[index].y +
          series!.nonCirculating[index].y,
      ).toBe(10),
    )
  })
})

describe('getSupplySummary', function () {
  it('should report the latest value, its share and the change over the range', function () {
    const summary = getSupplySummary({ points, unit: 'hemi' })

    expect(summary!.circulating).toEqual({ change: 2, share: 0.3, value: 3 })
    expect(summary!.staked).toEqual({ change: 2, share: 0.4, value: 4 })
  })

  it('should measure the change in the selected unit', function () {
    const summary = getSupplySummary({ points, unit: 'usd' })

    expect(summary!.circulating.value).toBe(15)
    expect(summary!.circulating.change).toBe(13)
  })

  it('should report the price change as a ratio', function () {
    const summary = getSupplySummary({ points, unit: 'hemi' })

    expect(summary!.price).toEqual({ change: 1.5, value: 5 })
  })

  it('should return nothing without points', function () {
    expect(getSupplySummary({ points: [], unit: 'hemi' })).toBeUndefined()
  })
})

describe('parseSupplyPoints dates', function () {
  const withDate = (date: string) => [{ ...rawFirst, date }]

  it('should reject a day past the end of its month', function () {
    expect(() => parseSupplyPoints(withDate('2026-02-30'), 18)).toThrow()
    expect(() => parseSupplyPoints(withDate('2026-04-31'), 18)).toThrow()
  })

  it('should reject a date it cannot read at all', function () {
    expect(() => parseSupplyPoints(withDate('2026-13-01'), 18)).toThrow()
    expect(() => parseSupplyPoints(withDate('not-a-date'), 18)).toThrow()
  })

  it('should take a leap day in a leap year', function () {
    expect(parseSupplyPoints(withDate('2028-02-29'), 18)[0].timestamp).toBe(
      Date.UTC(2028, 1, 29),
    )
  })

  it('should read the date half of a full timestamp', function () {
    expect(
      parseSupplyPoints(withDate('2026-01-05T13:45:00Z'), 18)[0].timestamp,
    ).toBe(Date.UTC(2026, 0, 5))
  })
})

describe('when the feed has no prices', function () {
  const unpriced = parseSupplyPoints(
    [rawFirst, rawLast].map(point => ({ ...point, priceUsd: null })),
    18,
  )

  it('should still parse the token amounts', function () {
    expect(unpriced[0].circulating).toBe(1)
    expect(unpriced[0].priceUsd).toBeNull()
  })

  it('should leave the token chart untouched', function () {
    expect(
      toChartSeries({ points: unpriced, unit: 'hemi' })!.circulating.map(
        point => point.y,
      ),
    ).toEqual([1, 3])
  })

  it('should return nothing for the usd chart', function () {
    expect(toChartSeries({ points: unpriced, unit: 'usd' })).toBeUndefined()
  })

  it('should return nothing for the usd summary', function () {
    expect(getSupplySummary({ points: unpriced, unit: 'usd' })).toBeUndefined()
  })

  it('should keep the token summary and drop only the price', function () {
    const summary = getSupplySummary({ points: unpriced, unit: 'hemi' })

    expect(summary!.circulating).toEqual({ change: 2, share: 0.3, value: 3 })
    expect(summary!.price).toBeUndefined()
  })

  it('should treat a price missing from the payload as no price', function () {
    const [point] = parseSupplyPoints(
      [{ ...rawFirst, priceUsd: undefined }],
      18,
    )

    expect(point.priceUsd).toBeNull()
  })
})
