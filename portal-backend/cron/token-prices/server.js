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
    console.error(`Failed to refresh prices: ${err}`)
  } else {
    console.log('Prices refreshed')
  }
}

const refreshPricesMin = config.get('refreshPricesMin')
if (refreshPricesMin > 0) {
  startInterval(run, refreshPricesMin * 60 * 1000)
} else {
  run()
}
