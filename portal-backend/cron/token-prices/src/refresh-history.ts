import { createClient } from 'redis'
import fetchJson from 'tiny-fetch-json'

import { config } from './config.ts'

type Quote = { USD?: { price?: number } }

type HistoricalQuote = { quote?: Quote; timestamp: string }

type History = Record<string, string>

const coinMarketCap = config.get('coinMarketCap')

const dayMs = 24 * 60 * 60 * 1000

const fetchTimeoutMs = 30 * 1000

// we store up to one year worth of data
const historyDays = 365

const keyPrefix = 'daily-prices:'

const priceUrl =
  'https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/historical'

const hasPrice = ({ quote }: HistoricalQuote) =>
  typeof quote?.USD?.price === 'number'

const toDate = (time: number) => new Date(time).toISOString().slice(0, 10)

const startOfDay = (date: string) => Date.parse(`${date}T00:00:00Z`)

// A daily quote stamped at midnight closes the day before it.
const closingDate = (time: number) =>
  toDate(Math.round(time / dayMs) * dayMs - 1)

async function fetchPrices({
  firstDate,
  lastDate,
  symbol,
}: {
  firstDate: string
  lastDate: string
  symbol: string
}) {
  const days = (startOfDay(lastDate) - startOfDay(firstDate)) / dayMs + 1
  const params = new URLSearchParams([
    ['convert', 'USD'],
    ['count', String(days + 1)],
    ['id', coinMarketCap.ids[symbol]],
    ['interval', 'daily'],
    ['time_start', new Date(startOfDay(firstDate)).toISOString()],
  ])
  const { data } = await fetchJson(`${priceUrl}?${params}`, {
    headers: {
      'Accept-Encoding': 'deflate, gzip',
      'X-CMC_PRO_API_KEY': coinMarketCap.apiKey,
    },
    signal: AbortSignal.timeout(fetchTimeoutMs),
  })

  // The historical quotes are keyed by coin id, as the latest ones are.
  const [coin] = Object.values<{ quotes?: HistoricalQuote[] }>(data ?? {})
  if (!coin?.quotes) {
    throw new Error(
      `Failed to fetch ${symbol} prices: the response has no quotes`,
    )
  }
  return Object.fromEntries(
    coin.quotes
      .filter(hasPrice)
      .map(({ quote, timestamp }) => [
        closingDate(Date.parse(timestamp)),
        String(quote!.USD!.price),
      ]),
  )
}

const client = createClient(config.get('redis'))

// The newest day CoinMarketCap answered a price for.
const newestDate = (prices: History) => Object.keys(prices).sort().at(-1)

async function refreshSymbol(symbol: string) {
  const key = `${keyPrefix}${symbol}`
  const stored = await client.get(key)
  const history: History = stored ? JSON.parse(stored) : {}
  const lastDate = toDate(Date.now() - dayMs)
  const newest = newestDate(history)
  if (newest === lastDate) {
    return 0
  }
  const windowStart = toDate(startOfDay(lastDate) - (historyDays - 1) * dayMs)
  const firstDate =
    newest && newest > windowStart
      ? toDate(startOfDay(newest) + dayMs)
      : windowStart
  if (firstDate > lastDate) {
    return 0
  }
  const fetched = await fetchPrices({ firstDate, lastDate, symbol })
  const prices = Object.fromEntries(
    Object.entries({ ...history, ...fetched }).filter(
      ([date]) => date >= windowStart && date <= lastDate,
    ),
  )
  if (newestDate(prices) === newest) {
    return 0
  }
  await client.set(key, JSON.stringify(prices))
  return Object.keys(prices).filter(date => !(date in history)).length
}

export async function refreshHistory() {
  try {
    client.connect()
    const saved = await Promise.all(
      Object.keys(coinMarketCap.ids).map(symbol =>
        refreshSymbol(symbol).catch(function (error: unknown) {
          console.warn(
            `Failed to refresh the ${symbol} price history: ${error}`,
          )
          return 0
        }),
      ),
    )
    return saved.reduce((total, days) => total + days, 0)
  } finally {
    client.quit()
  }
}
