import type { RequestHandler } from 'express'

import { BadRequestError } from './errors.ts'
import { getPeriodDates, isPeriod } from './periods.ts'
import { type Cache } from './redis.ts'

export function createPriceHistory({ cache }: { cache: Cache }) {
  async function getPriceHistory(symbol: string, period: string) {
    if (!isPeriod(period)) {
      throw new BadRequestError(`${period} is not a price history period`)
    }
    const prices = await cache.getPriceHistory(symbol)
    if (!prices) {
      throw new Error(`${symbol} has no price history`)
    }
    const { firstDate, lastDate } = getPeriodDates(period)
    return Object.entries(prices)
      .filter(([date]) => date >= firstDate && date <= lastDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, priceUsd]) => ({ date, priceUsd }))
  }

  return { getPriceHistory }
}

export function createCheckPriceSymbol(coinMarketCapIds: string) {
  const symbols = coinMarketCapIds.split(',').map(pair => pair.split(':')[0])
  const checkPriceSymbol: RequestHandler = function (req, res, next) {
    const { symbol } = req.params
    if (typeof symbol !== 'string' || !symbols.includes(symbol)) {
      res.status(400).send({ error: 'Bad Request' })
      return
    }
    next()
  }
  return checkPriceSymbol
}
