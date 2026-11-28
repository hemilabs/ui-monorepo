import safeAsyncFn from 'safe-async-fn'

import { checkVaults } from './src/check-vaults.ts'
import { config } from './src/config.ts'

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

run()

const vaultsMonitoringMin = config.get('vaultsMonitoringMin')
if (vaultsMonitoringMin > 0) {
  setInterval(run, vaultsMonitoringMin * 60 * 1000)
}
