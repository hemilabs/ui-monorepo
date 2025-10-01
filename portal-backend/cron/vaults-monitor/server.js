'use strict'

const startInterval = require('startinterval2')
const safeAsyncFn = require('safe-async-fn')

require('./src/instrument.js')

const { checkVaults } = require('./src/check-vaults')
const config = require('./src/config')

const safeCheckVaults = safeAsyncFn(checkVaults)

async function run() {
  const [err] = await safeCheckVaults({
    apiUrl: config.get('apiUrl'),
    maxBlocksBehind: config.get('maxBlocksBehind'),
    slack: config.get('slack'),
  })
  if (err) {
    console.warn(`Failed to check vaults: ${err}`)
  } else {
    console.log('Vaults checked')
  }
}

const vaultsMonitoringMin = config.get('vaultsMonitoringMin')
if (vaultsMonitoringMin > 0) {
  startInterval(run, vaultsMonitoringMin * 60 * 1000)
} else {
  run()
}
