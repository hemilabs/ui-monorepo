import config from 'config'
import { describe, expect, it } from 'vitest'

describe('supply.corrections', function () {
  const corrections =
    config.get<{ amount: string; from: string; source: string }[]>(
      'supply.corrections',
    )
  const froms = corrections.map(({ from }) => from)

  it('has a valid start date in every correction', function () {
    froms.forEach(function (from) {
      expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(new Date(`${from}T00:00:00Z`).toISOString()).toContain(from)
    })
  })

  it('has no start date in the future', function () {
    froms.forEach(function (from) {
      expect(new Date(`${from}T00:00:00Z`).getTime()).toBeLessThanOrEqual(
        Date.now(),
      )
    })
  })

  it('sorts the start dates in ascending order', function () {
    expect(froms).toEqual([...new Set(froms)].sort())
  })

  it('has a source in every correction', function () {
    corrections.forEach(({ source }) => expect(source).toMatch(/\S/))
  })

  it('has an amount in wei in every correction', function () {
    corrections.forEach(({ amount }) => expect(amount).toMatch(/^\d+$/))
  })
})
