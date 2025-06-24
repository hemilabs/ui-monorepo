'use strict'

const fetchJson = require('tiny-fetch-json')
const redis = require('redis')
const safeAsyncFn = require('safe-async-fn')
const startInterval = require('startinterval2')

const cacheExpirationStr = process.env.CACHE_EXPIRATION_SEC || '3600' // 1h
const cacheExpiration = parseInt(cacheExpirationStr)
const coinMarketCapApiKey = process.env.COIN_MARKET_CAP_API_KEY || ''
const coinMarketCapSlugs = process.env.COIN_MARKET_CAP_SLUGS || 'bitcoin'
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
const refreshIntervalStr = process.env.REFRESH_INTERVAL_SEC || '300' // 5m
const refreshInterval = parseInt(refreshIntervalStr)

async function fetchPrices() {
  const url =
    'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest'
  const params = { slug: coinMarketCapSlugs }
  const headers = {
    'Accept-Encoding': 'deflate, gzip',
    'X-CMC_PRO_API_KEY': coinMarketCapApiKey,
  }
  const fullUrl = `${url}?${new URLSearchParams(params).toString()}`
  const res = await fetchJson(fullUrl, { headers })
  return Object.fromEntries(
    Object.values(res.data).map(({ quote, symbol }) => [
      symbol.toUpperCase(),
      quote.USD.price,
    ]),
  )
}

async function storePrices(prices) {
  const client = redis.createClient({ url: redisUrl })
  await client.connect()
  await Promise.all(
    Object.entries(prices)
      .map(([symbol, price]) =>
        client.set(`price:${symbol}`, price, { EX: cacheExpiration }),
      )
      .concat(client.set('time', Date.now())),
  )
  client.quit()
}

async function refreshPrices() {
  const prices = await fetchPrices()
  await storePrices(prices)
}

const safeRefreshPrices = safeAsyncFn(refreshPrices)

if (refreshInterval > 0) {
  startInterval(async function () {
    const [err] = await safeRefreshPrices()
    if (err) {
      console.error(`Failed to refresh prices: ${err}`) // eslint-disable-line no-console
    }
  }, refreshInterval * 1000)
} else {
  refreshPrices()
}
