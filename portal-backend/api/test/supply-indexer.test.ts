import { parseUnits } from 'viem'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { BadRequestError } from '../src/errors.ts'
import { createSupplyIndexer } from '../src/supply-indexer.ts'

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
  baseOpBalances: hemi('1'),
  bnbBlock: 1,
  bnbInvestorAllocation: hemi('6'),
  bnbOpBalances: hemi('1'),
  bnbSafe: hemi('3'),
  burned: hemi('0'),
  date: yesterday,
  ethBlock: 2,
  ethInvestorAllocation: hemi('8'),
  ethOpBalances: hemi('1'),
  ethSafe: hemi('4'),
  hemiBlock: 3,
  hemiFoundationFinance: hemi('2'),
  hemiInvestorAllocation: hemi('9'),
  hemiSafe: hemi('1'),
  locked: hemi('5'),
  merkle: hemi('10'),
  opBalances: hemi('2'),
  totalSupply: hemi('100'),
}

type Correction = { amount: string; from: string }

const noCache = { getPriceHistory: async () => null }

const createIndexer = (corrections: string | Correction[], merkleLocked = 50) =>
  createSupplyIndexer({
    // @ts-expect-error fake cache
    cache: noCache,
    corrections:
      typeof corrections === 'string'
        ? [{ amount: corrections, from: '2025-09-23' }]
        : corrections,
    merkleLocked,
  })

const createIndexerWithPrices = (prices: Record<string, string>) =>
  createSupplyIndexer({
    // @ts-expect-error fake cache
    cache: { getPriceHistory: async () => prices },
    corrections: [{ amount: '0', from: '2025-09-23' }],
    merkleLocked: 50,
  })

describe('getSupplyHistory', function () {
  it('weights the merkle balance and adds the correction', async function () {
    requestHemiEarn.mockResolvedValue({
      data: { DailySupplySnapshot: [row] },
    })
    const { getSupplyHistory } = createIndexer(hemi('7'), 50)

    const [point] = await getSupplyHistory('1m')

    // 1 safe + 3 safe + 4 safe + 9 + 6 + 8 investor + 2 foundation
    // + 0 burned + 2 + 1 + 1 + 1 op + 5 of the merkle box + 7
    expect(point.nonCirculating).toBe(hemi('50'))
    expect(point.staked).toBe(hemi('5'))
    expect(point.totalSupply).toBe(hemi('100'))
    expect(point.circulating).toBe(hemi('45'))
  })

  it('adds the correction of the range that holds each day', async function () {
    requestHemiEarn.mockResolvedValue({
      data: {
        DailySupplySnapshot: [
          { ...row, date: '2026-09-04' },
          { ...row, date: '2026-09-05' },
        ],
      },
    })
    const { getSupplyHistory } = createIndexer([
      { amount: hemi('7'), from: '2025-09-23' },
      { amount: hemi('3'), from: '2026-09-05' },
    ])

    const [first, second] = await getSupplyHistory('1m')

    expect(first.nonCirculating).toBe(hemi('50'))
    expect(second.nonCirculating).toBe(hemi('46'))
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
      corrections: [{ amount: '0', from: '2025-09-23' }],
      merkleLocked: 50,
    })

    const [point] = await getSupplyHistory('1m')

    expect(point.priceUsd).toBeNull()
    expect(point.circulating).toBe(hemi('52'))
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
      corrections: [{ amount: '0', from: '2025-09-23' }],
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

    expect(await getCirculatingSupply()).toBe('45.000000000000000000')
  })

  it('adds the last correction', async function () {
    requestHemiEarn.mockResolvedValue({
      data: { DailySupplySnapshot: [row] },
    })
    const { getCirculatingSupply } = createIndexer([
      { amount: hemi('1000'), from: '2025-09-23' },
      { amount: hemi('7'), from: '2026-09-05' },
    ])

    expect(await getCirculatingSupply()).toBe('45.000000000000000000')
  })

  it('keeps the sign when the correction exceeds the supply', async function () {
    requestHemiEarn.mockResolvedValue({
      data: { DailySupplySnapshot: [row] },
    })
    const { getCirculatingSupply } = createIndexer(hemi('1000'), 50)

    expect(await getCirculatingSupply()).toBe('-948.000000000000000000')
  })

  it('fails when the indexer has no day that every chain has reached', async function () {
    requestHemiEarn.mockResolvedValue({ data: { DailySupplySnapshot: [] } })
    const { getCirculatingSupply } = createIndexer('0', 50)

    await expect(getCirculatingSupply()).rejects.toThrow('every chain')
  })
})
