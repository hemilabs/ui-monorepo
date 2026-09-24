import safeAsyncFn from 'safe-async-fn'
import startInterval from 'startinterval2'

import { config } from './src/config.ts'
import { refreshHistory } from './src/refresh-history.ts'
import { refreshPrices } from './src/refresh-prices.ts'

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
  } else if (saved && saved > 0) {
    console.log(`Price history refreshed with ${saved} days`)
  }
}

console.log(`Token prices cron v${config.get('version')} started`)

const refreshPricesMin = config.get('refreshPricesMin')
if (refreshPricesMin > 0) {
  const intervalMs = refreshPricesMin * 60 * 1000
  startInterval(run, intervalMs)
  startInterval(runHistory, intervalMs)
} else {
  run()
  runHistory()
}
