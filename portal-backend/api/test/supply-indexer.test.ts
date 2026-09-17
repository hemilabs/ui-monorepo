import { parseUnits } from 'viem'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { BadRequestError } from '../src/errors.ts'
import { createSupplyIndexer, isSupplyPeriod } from '../src/supply-indexer.ts'

const { requestHemiEarn } = vi.hoisted(() => ({
  requestHemiEarn: vi.fn(),
}))

vi.mock('../src/subgraphs/subgraph.ts', async importOriginal => ({
  ...(await importOriginal<typeof import('../src/subgraphs/subgraph.ts')>()),
  requestHemiEarn,
}))

const today = '2026-09-11'
const yesterday = '2026-09-10'

beforeAll(function () {
  vi.useFakeTimers()
  vi.setSystemTime(Date.parse(`${today}T12:00:00Z`))
})

afterAll(function () {
  vi.useRealTimers()
})

const hemi = (amount: string) => parseUnits(amount, 18).toString()

const row = {
  bnbBlock: 1,
  bnbSafe: hemi('3'),
  burned: hemi('0'),
  date: yesterday,
  ethBlock: 2,
  ethSafe: hemi('4'),
  hemiBlock: 3,
  hemiSafe: hemi('1'),
  locked: hemi('5'),
  merkle: hemi('10'),
  opBalances: hemi('2'),
  totalSupply: hemi('100'),
}

const noCache = { getPriceHistory: async () => null }

const createIndexer = (correction: string, merkleLocked: number) =>
  // @ts-expect-error fake cache
  createSupplyIndexer({ cache: noCache, correction, merkleLocked })

const createIndexerWithPrices = (prices: Record<string, string>) =>
  createSupplyIndexer({
    // @ts-expect-error fake cache
    cache: { getPriceHistory: async () => prices },
    correction: '0',
    merkleLocked: 50,
  })

describe('getSupplyHistory', function () {
  it('weights the merkle balance and adds the correction', async function () {
    requestHemiEarn.mockResolvedValue({
      data: { DailySupplySnapshot: [row] },
    })
    const { getSupplyHistory } = createIndexer(hemi('7'), 50)

    const [point] = await getSupplyHistory('1m')

    // 1 safe + 3 safe + 4 safe + 0 burned + 2 op + 5 of the merkle box + 7
    expect(point.nonCirculating).toBe(hemi('22'))
    expect(point.staked).toBe(hemi('5'))
    expect(point.totalSupply).toBe(hemi('100'))
    expect(point.circulating).toBe(hemi('73'))
  })

  it.each([
    ['1w', 7],
    ['1m', 30],
    ['3m', 90],
    ['6m', 180],
    ['1y', 365],
  ])('asks for the days of the %s period', async function (period, days) {
    requestHemiEarn.mockResolvedValue({ data: { DailySupplySnapshot: [] } })
    const { getSupplyHistory } = createIndexer('0', 50)

    await getSupplyHistory(period as string)

    const [payload] = requestHemiEarn.mock.calls.at(-1)!
    const { firstDate, lastDate } = payload.variables
    expect(lastDate).toBe(yesterday)
    expect(
      (Date.parse(`${lastDate}T00:00:00Z`) -
        Date.parse(`${firstDate}T00:00:00Z`)) /
        (24 * 60 * 60 * 1000) +
        1,
    ).toBe(days)
  })

  it('answers the price of the stored history', async function () {
    requestHemiEarn.mockResolvedValue({
      data: { DailySupplySnapshot: [row] },
    })
    const { getSupplyHistory } = createIndexerWithPrices({
      '2026-09-08': '1',
      [yesterday]: '0.0042',
    })

    const [point] = await getSupplyHistory('1m')

    expect(point.priceUsd).toBe('0.0042')
  })

  it.each([
    ['the history has no price for', { '2026-09-08': '1' }],
    ['the history is empty for', {}],
  ])('answers a null price for a day %s', async function (_, prices) {
    requestHemiEarn.mockResolvedValue({
      data: { DailySupplySnapshot: [row] },
    })
    const { getSupplyHistory } = createIndexerWithPrices(prices)

    const [point] = await getSupplyHistory('1m')

    expect(point.priceUsd).toBeNull()
  })

  it('answers a null price when the history is not stored yet', async function () {
    requestHemiEarn.mockResolvedValue({
      data: { DailySupplySnapshot: [row] },
    })
    const { getSupplyHistory } = createIndexer('0', 50)

    const [point] = await getSupplyHistory('1m')

    expect(point.priceUsd).toBeNull()
  })

  it('answers the supply with no price when the cache fails', async function () {
    requestHemiEarn.mockResolvedValue({
      data: { DailySupplySnapshot: [row] },
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { getSupplyHistory } = createSupplyIndexer({
      // @ts-expect-error fake cache
      cache: {
        getPriceHistory: async () => Promise.reject(new Error('no connection')),
      },
      correction: '0',
      merkleLocked: 50,
    })

    const [point] = await getSupplyHistory('1m')

    expect(point.priceUsd).toBeNull()
    expect(point.circulating).toBe(hemi('80'))
    expect(warn).toHaveBeenCalled()
  })

  it('reads the history of HEMI', async function () {
    requestHemiEarn.mockResolvedValue({
      data: { DailySupplySnapshot: [row] },
    })
    const getPriceHistory = vi.fn(async () => null)
    const { getSupplyHistory } = createSupplyIndexer({
      // @ts-expect-error fake cache
      cache: { getPriceHistory },
      correction: '0',
      merkleLocked: 50,
    })

    await getSupplyHistory('1w')

    expect(getPriceHistory).toHaveBeenCalledWith('HEMI')
  })

  it('rejects a period it does not know', async function () {
    const { getSupplyHistory } = createIndexer('0', 50)

    await expect(getSupplyHistory('2y')).rejects.toThrow(BadRequestError)
    expect(requestHemiEarn).not.toHaveBeenCalled()
  })
})

describe('getCirculatingSupply', function () {
  it('answers in HEMI, as the live endpoint does', async function () {
    requestHemiEarn.mockResolvedValue({
      data: { DailySupplySnapshot: [row] },
    })
    const { getCirculatingSupply } = createIndexer(hemi('7'), 50)

    expect(await getCirculatingSupply()).toBe('73.000000000000000000')
  })

  it('keeps the sign when the correction exceeds the supply', async function () {
    requestHemiEarn.mockResolvedValue({
      data: { DailySupplySnapshot: [row] },
    })
    const { getCirculatingSupply } = createIndexer(hemi('1000'), 50)

    expect(await getCirculatingSupply()).toBe('-920.000000000000000000')
  })

  it('fails when the indexer has no day that every chain has reached', async function () {
    requestHemiEarn.mockResolvedValue({ data: { DailySupplySnapshot: [] } })
    const { getCirculatingSupply } = createIndexer('0', 50)

    await expect(getCirculatingSupply()).rejects.toThrow('every chain')
  })
})

describe('isSupplyPeriod', function () {
  it.each(['1w', '1m', '3m', '6m', '1y'])(
    'answers true for %s',
    function (period) {
      expect(isSupplyPeriod(period)).toBe(true)
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
    expect(isSupplyPeriod(period)).toBe(false)
  })
})
