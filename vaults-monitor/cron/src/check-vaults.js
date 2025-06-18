'use strict'

const fetchJson = require('./fetch-json')
const safeAsyncFn = require('./safe-async-fn')
const postMessageToSlack = require('./post-message-to-slack')

const toBtc = sats => (sats / 100000000).toFixed(8)

function analyzeVaultsData({
  bitcoinChainData,
  tunnelManagerData,
  vaultsData,
}) {
  const alerts = []
  const blocksBehind =
    bitcoinChainData.bitcoin.height - bitcoinChainData.bitcoinKit.height
  if (blocksBehind > 2) {
    alerts.push(
      `BitcoinKit is ${blocksBehind} blocks behind the bitcoin blockchain`,
    )
  }
  if (tunnelManagerData.withdrawalsPaused) {
    alerts.push('Withdrawals are paused')
  }
  if (!vaultsData.length) {
    alerts.push('There are no vaults configured')
  }
  if (!vaultsData.some(data => data.status === 2)) {
    alerts.push('No vaults are in LIVE state')
  }
  vaultsData.forEach(function (data, i) {
    if (data.status === 0 || data.status === 1) {
      // Vault is CREATED or INITIALIZING
      return
    }

    if (data.status === 2 || data.status === 3) {
      // Vault is LIVE or CLOSING_INIT
      if (data.balanceSats < data.pendingWithdrawalAmountSat) {
        alerts.push(
          `Vault ${i} at ${data.vaultAddress} does not have enough BTC in ${
            data.bitcoinCustodyAddress
          } to complete ${
            data.pendingWithdrawalCount
          } pending withdrawals: (${toBtc(data.balanceSats)}) < (${toBtc(
            data.pendingWithdrawalAmountSat,
          )})`,
        )
      }
    }
  })
  return alerts
}

function sendAlertsToSlack({ alerts, slackMention, slackWebhookUrl }) {
  const intro =
    'The following problems were found when analyzing the bitcoin vaults:'
  const message = `${intro}\n\n${alerts.map(alert => `- ${alert}\n`)}`
  if (slackWebhookUrl) {
    postMessageToSlack(message, slackWebhookUrl, slackMention)
  } else {
    console.error(message) // eslint-disable-line no-console
  }
}

async function checkVaults({ apiUrl, slackMention, slackWebhookUrl }) {
  const state = await fetchJson(apiUrl)
  const alerts = analyzeVaultsData(state)
  if (alerts.length) {
    await sendAlertsToSlack({ alerts, slackMention, slackWebhookUrl })
  }
}

module.exports = safeAsyncFn(checkVaults)
