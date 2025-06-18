'use strict'

const startInterval = require('startinterval2')

const safeCheckVaults = require('./src/check-vaults')

const apiUrl = process.env.API_URL || 'http://localhost:3003'
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
const slackMention = process.env.SLACK_MENTION
const refreshIntervalStr = process.env.REFRESH_INTERVAL_SEC || '300' // 5m
const refreshInterval = parseInt(refreshIntervalStr)

async function run() {
  const [err] = await safeCheckVaults({ apiUrl, slackMention, slackWebhookUrl })
  if (err) {
    // eslint-disable-next-line no-console
    console.error(`Failed to check vaults: ${err.stack}`)
  }
}

if (refreshInterval > 0) {
  startInterval(run, refreshInterval * 1000)
} else {
  run()
}
