import config from 'config'
import { describe, expect, it } from 'vitest'

describe('supply.corrections', function () {
  const corrections =
    config.get<{ amount: string; until?: string }[]>('supply.corrections')
  const untils = corrections.slice(0, -1).map(({ until }) => until)

  it('ends with a correction with no end date', function () {
    expect(corrections.at(-1)).not.toHaveProperty('until')
  })

  it('has a valid end date in every other correction', function () {
    untils.forEach(function (until) {
      expect(until).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(new Date(`${until}T00:00:00Z`).toISOString()).toContain(until)
    })
  })

  it('sorts the end dates in ascending order', function () {
    expect(untils).toEqual([...new Set(untils)].sort())
  })

  it('has an amount in wei in every correction', function () {
    corrections.forEach(({ amount }) => expect(amount).toMatch(/^\d+$/))
  })
})
