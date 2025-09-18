'use strict'

const safeAsyncFn = require('safe-async-fn')
const startInterval = require('startinterval2')

require('./src/instrument.js')

const { refreshSupply } = require('./src/refresh-supply')
const config = require('./src/config')

const safeRefreshSupply = safeAsyncFn(refreshSupply)

async function run() {
  const [err] = await safeRefreshSupply()
  if (err) {
    console.error(`Failed to refresh HEMI supply data: ${err}`)
  } else {
    console.log('HEMI supply data refreshed')
  }
}

const refreshSupplyMin = config.get('refreshSupplyMin')
if (refreshSupplyMin > 0) {
  startInterval(run, refreshSupplyMin * 60 * 1000)
} else {
  run()
}
