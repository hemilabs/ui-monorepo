'use strict'

const safeAsyncFn = require('safe-async-fn')
const startInterval = require('startinterval2')

require('./src/instrument.js')

const { refreshHistory } = require('./src/refresh-history')
const { refreshPrices } = require('./src/refresh-prices')
const config = require('./src/config')

const safeRefreshHistory = safeAsyncFn(refreshHistory)
const safeRefreshPrices = safeAsyncFn(refreshPrices)

async function run() {
  const [err] = await safeRefreshPrices()
  if (err) {
    console.warn(`Failed to refresh token prices: ${err}`)
  } else {
    console.log('Token prices refreshed')
  }
}

async function runHistory() {
  const [err, saved] = await safeRefreshHistory()
  if (err) {
    console.warn(`Failed to refresh the price history: ${err}`)
  } else if (saved > 0) {
    console.log(`Price history refreshed with ${saved} days`)
  }
}

const refreshPricesMin = config.get('refreshPricesMin')
if (refreshPricesMin > 0) {
  startInterval(run, refreshPricesMin * 60 * 1000)
} else {
  run()
}

const refreshHistoryMin = config.get('refreshHistoryMin')
if (refreshHistoryMin > 0) {
  startInterval(runHistory, refreshHistoryMin * 60 * 1000)
} else {
  runHistory()
}
