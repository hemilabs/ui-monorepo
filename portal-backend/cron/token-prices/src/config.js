'use strict'

const env = (variable, defaultValue) => process.env[variable] || defaultValue

const config = {
  cacheExpirationMin: Number(env('CACHE_EXPIRATION_MIN', '60')),
  coinMarketCap: {
    apiKey: env('COIN_MARKET_CAP_API_KEY', ''),
    slugs: env('COIN_MARKET_CAP_SLUGS', 'bitcoin'),
  },
  redis: {
    url: env('REDIS_URL', 'redis://localhost:6379'),
  },
  refreshPricesMin: Number(env('REFRESH_PRICES_MIN', '5')),
}

const get = path =>
  path.split('.').reduce((partial, prop) => partial && partial[prop], config)

module.exports = {
  get,
}
