import safeAsyncFn from 'safe-async-fn'
import startInterval from 'startinterval2'

import { checkVaults } from './src/check-vaults.ts'
import config from './src/config.ts'

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
