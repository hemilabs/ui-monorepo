'use strict'

const env = (variable, defaultValue) => process.env[variable] || defaultValue

const config = {
  cacheExpirationMin: Number(env('CACHE_EXPIRATION_MIN', '60')),
  coinMarketCap: {
    apiKey: env('COIN_MARKET_CAP_API_KEY', ''),
    ids: Object.fromEntries(
      env('COIN_MARKET_CAP_IDS', 'HEMI:38159')
        .split(',')
        .map(pair => pair.split(':')),
    ),
    slugs: env('COIN_MARKET_CAP_SLUGS', 'bitcoin'),
  },
  redis: {
    url: env('REDIS_URL', 'redis://localhost:6379'),
  },
  refreshPricesMin: Number(env('REFRESH_PRICES_MIN', '5')),
  sentry: {
    dsn: env('SENTRY_DSN', ''),
    loggingLevels: env('SENTRY_LOGGING_LEVELS', 'log,warn,error').split(','),
  },
  version: env('npm_package_version', ''),
}

const get = path =>
  path.split('.').reduce((partial, prop) => partial && partial[prop], config)

const api = { get }

module.exports = api
