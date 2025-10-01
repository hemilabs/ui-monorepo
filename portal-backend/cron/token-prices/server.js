'use strict'

const safeAsyncFn = require('safe-async-fn')
const startInterval = require('startinterval2')

require('./src/instrument.js')

const { refreshPrices } = require('./src/refresh-prices')
const config = require('./src/config')

const safeRefreshPrices = safeAsyncFn(refreshPrices)

async function run() {
  const [err] = await safeRefreshPrices()
  if (err) {
    console.warn(`Failed to refresh token prices: ${err}`)
  } else {
    console.log('Token prices refreshed')
  }
}

const refreshPricesMin = config.get('refreshPricesMin')
if (refreshPricesMin > 0) {
  startInterval(run, refreshPricesMin * 60 * 1000)
} else {
  run()
}
