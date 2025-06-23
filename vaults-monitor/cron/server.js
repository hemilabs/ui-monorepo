'use strict'

const startInterval = require('startinterval2')

const checkVaults = require('./src/check-vaults')
const safeAsyncFn = require('./src/safe-async-fn')

const apiUrl = process.env.API_URL || 'http://localhost:3004'
const maxBlocksBehind = Number.parseInt(process.env.MAX_BLOCKS_BEHIND || '4')
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
const slackMention = process.env.SLACK_MENTION
const refreshInterval = Number.parseInt(
  process.env.REFRESH_INTERVAL_SEC || '300',
)

const safeCheckVaults = safeAsyncFn(checkVaults)

async function run() {
  const [err] = await safeCheckVaults({
    apiUrl,
    maxBlocksBehind,
    slackMention,
    slackWebhookUrl,
  })
  if (err) {
    console.error(`Failed to check vaults: ${err.stack}`)
  }
}

if (refreshInterval > 0) {
  startInterval(run, refreshInterval * 1000)
} else {
  run()
}
