import postMessageToSlack from 'post-message-to-slack'
import fetchJson from 'tiny-fetch-json'

// These values match the Status enum used in the BitcoinTunnelManager and
// BitcoinVault contracts.
/* eslint-disable sort-keys */
const VaultStatus = {
  CREATED: 0,
  INITIALIZING: 1,
  LIVE: 2,
  CLOSING_INIT: 3,
  CLOSING_VERIF: 4,
  CLOSED: 5,
}
/* eslint-enable sort-keys */

type VaultData = {
  balanceSats: number
  bitcoinCustodyAddress: string
  pendingWithdrawalAmountSat: number
  pendingWithdrawalCount: number
  status: number
  vaultAddress: string
}

type VaultsState = {
  bitcoinChainData: {
    bitcoin: { height: number }
    bitcoinKit: { height: number }
  }
  tunnelManagerData: { withdrawalsPaused: boolean }
  vaultsData: VaultData[]
}

type Slack = {
  mention: string
  webhookUrl: string
}

const toBtc = (sats: number) => (sats / 100000000).toFixed(8)

function analyzeVaultsData(
  { bitcoinChainData, tunnelManagerData, vaultsData }: VaultsState,
  { maxBlocksBehind }: { maxBlocksBehind: number },
) {
  const alerts: string[] = []
  const blocksBehind =
    bitcoinChainData.bitcoin.height - bitcoinChainData.bitcoinKit.height
  if (blocksBehind > maxBlocksBehind) {
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
  if (!vaultsData.some(data => data.status === VaultStatus.LIVE)) {
    alerts.push('No vaults are in LIVE state')
  }
  vaultsData.forEach(function (data, i) {
    if (
      data.status === VaultStatus.CREATED ||
      data.status === VaultStatus.INITIALIZING
    ) {
      return
    }

    if (
      data.status === VaultStatus.LIVE ||
      data.status === VaultStatus.CLOSING_INIT
    ) {
      // This check shall be improved.
      // See https://github.com/hemilabs/ui-monorepo/issues/1324
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

async function sendAlertsToSlack({
  alerts,
  mention,
  webhookUrl,
}: Slack & { alerts: string[] }) {
  const intro = 'Problems found when analyzing the bitcoin vaults:'
  const message = `${intro}\n\n${alerts.map(alert => `- ${alert}`).join('\n')}`
  const text = `${mention ? `<${mention}> ` : ''}${message}.`
  await postMessageToSlack(webhookUrl, { text })
}

export async function checkVaults({
  apiUrl,
  maxBlocksBehind,
  slack,
}: {
  apiUrl: string
  maxBlocksBehind: number
  slack: Slack
}) {
  console.log('Checking vaults...', apiUrl)
  const state: VaultsState = await fetchJson(`${apiUrl}/btc-vaults/43111`) // Hemi mainnet
  const alerts = analyzeVaultsData(state, { maxBlocksBehind })
  if (alerts.length && slack.webhookUrl) {
    await sendAlertsToSlack({ alerts, ...slack })
  } else if (alerts.length) {
    console.error(`Alerts: ${alerts.join(', ')}`)
  }
}
