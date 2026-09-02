'use strict'

const fetchJson = require('tiny-fetch-json')
const redis = require('redis')

const config = require('./config')

const coinMarketCap = config.get('coinMarketCap')

const hasPrice = ({ quote }) => typeof quote?.USD?.price === 'number'

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
  const tokens = Object.values(res.data)
  const unpriced = tokens.filter(token => !hasPrice(token))
  if (unpriced.length > 0) {
    console.warn(
      `Skipped tokens without a price: ${unpriced.map(({ symbol }) => symbol).join(', ')}`,
    )
  }
  return Object.fromEntries(
    tokens
      .filter(hasPrice)
      .map(({ quote, symbol }) => [symbol.toUpperCase(), quote.USD.price]),
  )
}

const client = redis.createClient(config.get('redis'))

const expiration = config.get('cacheExpirationMin') * 60

async function storePrices(prices) {
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

async function refreshPrices() {
  const prices = await fetchPrices()
  await storePrices(prices)
}

module.exports = {
  refreshPrices,
}
