import { createClient } from 'redis'
import fetchJson from 'tiny-fetch-json'

import config from './config.ts'

type Token = { quote?: { USD?: { price?: number } }; symbol: string }

const coinMarketCap = config.get('coinMarketCap')

const hasPrice = ({ quote }: Token) => typeof quote?.USD?.price === 'number'

async function fetchPrices() {
  const url =
    'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest'
  const params = { slug: coinMarketCap.slugs }
  const headers = {
    'Accept-Encoding': 'deflate, gzip',
    'X-CMC_PRO_API_KEY': coinMarketCap.apiKey,
  }
  const fullUrl = `${url}?${new URLSearchParams(params).toString()}`
  const res = await fetchJson(fullUrl, { headers })
  const tokens = Object.values<Token>(res.data)
  const unpriced = tokens.filter(token => !hasPrice(token))
  if (unpriced.length > 0) {
    console.warn(
      `Skipped tokens without a price: ${unpriced.map(({ symbol }) => symbol).join(', ')}`,
    )
  }
  return Object.fromEntries(
    tokens
      .filter(hasPrice)
      .map(({ quote, symbol }) => [symbol.toUpperCase(), quote!.USD!.price!]),
  )
}

const client = createClient(config.get('redis'))

const expiration = config.get('cacheExpirationMin') * 60

async function storePrices(prices: Record<string, number>) {
  try {
    client.connect()
    await Promise.all(
      Object.entries(prices)
        .map(([symbol, price]) =>
          client.set(`price:${symbol}`, price, { EX: expiration }),
        )
        .concat(client.set('time', Date.now())),
    )
  } finally {
    client.quit() // Release the connection to allow the process to exit
  }
}

export async function refreshPrices() {
  const prices = await fetchPrices()
  await storePrices(prices)
}
