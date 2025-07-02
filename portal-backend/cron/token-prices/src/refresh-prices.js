'use strict'

const fetchJson = require('tiny-fetch-json')
const redis = require('redis')

const config = require('./config')

const coinMarketCap = config.get('coinMarketCap')

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
  return Object.fromEntries(
    Object.values(res.data).map(({ quote, symbol }) => [
      symbol.toUpperCase(),
      quote.USD.price,
    ]),
  )
}

const client = redis.createClient(config.get('redis'))
client.connect()

const expiration = config.get('cacheExpirationMin') * 60

const storePrices = prices =>
  Promise.all(
    Object.entries(prices)
      .map(([symbol, price]) =>
        client.set(`price:${symbol}`, price, { EX: expiration }),
      )
      .concat(client.set('time', Date.now())),
  )

async function refreshPrices() {
  const prices = await fetchPrices()
  await storePrices(prices)
}

module.exports = {
  refreshPrices,
}
