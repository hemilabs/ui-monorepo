'use strict'

const redis = require('redis')
const startInterval = require('startinterval2')

const cacheExpirationStr = process.env.CACHE_EXPIRATION_SEC || '3600' // 1h
const cacheExpiration = parseInt(cacheExpirationStr)
const coinMarketCapApiKey = process.env.COIN_MARKET_CAP_API_KEY || ''
const coinMarketCapSlugs = process.env.COIN_MARKET_CAP_SLUGS || 'bitcoin'
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
const refreshIntervalStr = process.env.REFRESH_INTERVAL_SEC || '300' // 5m
const refreshInterval = parseInt(refreshIntervalStr)

const safeFn = (asyncFn, errorMessage = '') =>
  async function (...args) {
    try {
      await asyncFn(...args)
    } catch (err) {
      console.error(`${errorMessage}: ${err}`) // eslint-disable-line no-console
    }
  }

async function fetchJson(url, params, headers) {
  const fullUrl = `${url}?${new URLSearchParams(params).toString()}`
  const fullHeaders = { accept: 'application/json', ...headers }
  const res = await fetch(fullUrl, { headers: fullHeaders })
  if (!res.ok) {
    throw new Error(`Failed to fetch data: ${res.statusText}`)
  }
  return res.json()
}

async function fetchPrices() {
  const url =
    'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest'
  const params = { slug: coinMarketCapSlugs }
  const headers = {
    'Accept-Encoding': 'deflate, gzip',
    'X-CMC_PRO_API_KEY': coinMarketCapApiKey,
  }
  const res = await fetchJson(url, params, headers)
  return Object.fromEntries(
    Object.values(res.data).map(({ symbol, quote }) => [
      symbol,
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

if (refreshInterval > 0) {
  startInterval(
    safeFn(refreshPrices, 'Failed to refresh prices'),
    refreshInterval * 1000,
  )
} else {
  refreshPrices()
}
