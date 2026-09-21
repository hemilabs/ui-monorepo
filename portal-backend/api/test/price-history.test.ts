import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { BadRequestError } from '../src/errors.ts'
import {
  createCheckPriceSymbol,
  createPriceHistory,
} from '../src/price-history.ts'

beforeAll(function () {
  vi.useFakeTimers()
  vi.setSystemTime(Date.parse('2026-09-11T12:00:00Z'))
})

afterAll(function () {
  vi.useRealTimers()
})

const createWithPrices = (prices: Record<string, string> | null) =>
  // @ts-expect-error fake cache
  createPriceHistory({ cache: { getPriceHistory: async () => prices } })

describe('getPriceHistory', function () {
  it('answers the prices of the period sorted by date', async function () {
    const { getPriceHistory } = createWithPrices({
      '2026-09-03': '1',
      '2026-09-04': '2',
      '2026-09-06': '4',
      // eslint-disable-next-line sort-keys
      '2026-09-05': '3',
      '2026-09-10': '5',
      '2026-09-11': '6',
    })

    expect(await getPriceHistory('HEMI', '1w')).toEqual([
      { date: '2026-09-04', priceUsd: '2' },
      { date: '2026-09-05', priceUsd: '3' },
      { date: '2026-09-06', priceUsd: '4' },
      { date: '2026-09-10', priceUsd: '5' },
    ])
  })

  it('reads the history of the symbol', async function () {
    const getPriceHistory = vi.fn(async () => ({}))
    // @ts-expect-error fake cache
    const priceHistory = createPriceHistory({ cache: { getPriceHistory } })

    await priceHistory.getPriceHistory('BTC', '1m')

    expect(getPriceHistory).toHaveBeenCalledWith('BTC')
  })

  it('fails when the symbol has no history', async function () {
    const { getPriceHistory } = createWithPrices(null)

    await expect(getPriceHistory('HEMI', '1m')).rejects.toThrow(
      'HEMI has no price history',
    )
  })

  it('rejects a period it does not know', async function () {
    const { getPriceHistory } = createWithPrices({})

    await expect(getPriceHistory('HEMI', '2y')).rejects.toThrow(BadRequestError)
  })
})

describe('createCheckPriceSymbol', function () {
  const checkPriceSymbol = createCheckPriceSymbol(
    'BTC:1,FRXUSD:36039,HEMI:38159,USDC:3408,USDT:825',
  )

  const check = function (symbol: string) {
    const next = vi.fn()
    const res = { send: vi.fn(), status: vi.fn() }
    res.status.mockReturnValue(res)
    checkPriceSymbol({ params: { symbol } }, res, next)
    return { next, res }
  }

  it.each(['BTC', 'FRXUSD', 'HEMI', 'USDC', 'USDT'])(
    'accepts %s',
    function (symbol) {
      const { next, res } = check(symbol)

      expect(next).toHaveBeenCalledOnce()
      expect(res.status).not.toHaveBeenCalled()
    },
  )

  it.each([
    ['a symbol that is not in the list', 'ETH'],
    ['a symbol in another case', 'hemi'],
    ['a part of a symbol', 'HEM'],
    ['the id of a symbol', '38159'],
    ['a pair of the list', 'HEMI:38159'],
    ['an empty string', ''],
    ['a property of the prototype', 'toString'],
  ])('rejects %s', function (_, symbol) {
    const { next, res } = check(symbol)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.send).toHaveBeenCalledWith({ error: 'Bad Request' })
  })

  it('accepts the only symbol of a single pair', function () {
    const next = vi.fn()

    createCheckPriceSymbol('HEMI:38159')(
      { params: { symbol: 'HEMI' } },
      {},
      next,
    )

    expect(next).toHaveBeenCalledOnce()
  })
})
