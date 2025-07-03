'use strict'

const { esploraClient } = require('esplora-client')
const {
  getBitcoinChainLastHeader,
  getBitcoinCustodyAddress,
  getBitcoinVaultStateAddress,
  getPendingWithdrawalAmountSat,
  getPendingWithdrawalCount,
  getTunnelManagerStatus,
  getVaultByIndex,
  getVaultCounter,
  getVaultStatus,
  hemi,
  hemiSepolia,
} = require('hemi-viem')
const viem = require('viem')

function getHemiClient(chainId) {
  const chain = { [hemi.id]: hemi, [hemiSepolia.id]: hemiSepolia }[chainId]
  const transport = viem.http()
  return viem.createPublicClient({ chain, transport })
}

async function getBitcoinChainHeight(network) {
  const client = esploraClient({ network })
  const height = await client.bitcoin.blocks.getBlocksTipHeight()
  return { height }
}

async function getBitcoinChainData(client) {
  const [bitcoin, bitcoinKit] = await Promise.all([
    getBitcoinChainHeight(client.chain.testnet ? 'testnet' : 'mainnet'),
    getBitcoinChainLastHeader(client),
  ])
  return {
    bitcoin,
    bitcoinKit,
  }
}

async function getBitcoinAddressBalance(network, address) {
  const client = esploraClient({ network })
  const addressData = await client.bitcoin.addresses.getAddress({ address })
  return (
    addressData.chain_stats.funded_txo_sum -
    addressData.chain_stats.spent_txo_sum
  )
}

async function getVaultBitcoinBalanceData(client, { vaultAddress }) {
  const bitcoinCustodyAddress = await getBitcoinCustodyAddress(client, {
    vaultAddress,
  })
  const balanceSats = bitcoinCustodyAddress
    ? await getBitcoinAddressBalance(
        client.chain.testnet ? 'testnet' : 'mainnet',
        bitcoinCustodyAddress,
      )
    : 0
  return { balanceSats, bitcoinCustodyAddress }
}

async function getVaultPendingWithdrawalsData(client, { vaultAddress }) {
  const vaultStateAddress = await getBitcoinVaultStateAddress(client, {
    vaultAddress,
  })
  const pendingWithdrawalCount = Number(
    await getPendingWithdrawalCount(client, {
      vaultStateAddress,
    }),
  )
  const pendingWithdrawalAmountSat = pendingWithdrawalCount
    ? Number(await getPendingWithdrawalAmountSat(client, { vaultStateAddress }))
    : 0
  return {
    pendingWithdrawalAmountSat,
    pendingWithdrawalCount,
  }
}

async function getVaultData(client, { vaultIndex }) {
  const vaultAddress = await getVaultByIndex(client, { vaultIndex })
  const [bitcoinBalanceData, pendingWithdrawalsData, status] =
    await Promise.all([
      getVaultBitcoinBalanceData(client, { vaultAddress }),
      getVaultPendingWithdrawalsData(client, { vaultAddress }),
      getVaultStatus(client, { vaultAddress }),
    ])
  return {
    status,
    vaultAddress,
    ...bitcoinBalanceData,
    ...pendingWithdrawalsData,
  }
}

async function getAllVaultsData(client) {
  const length = await getVaultCounter(client)
  return Promise.all(
    Array.from({ length }, (_, i) => getVaultData(client, { vaultIndex: i })),
  )
}

/**
 * @param {number} chainId
 */
async function getBtcVaultsData(chainId) {
  const client = getHemiClient(chainId)
  const isTestnet = client.chain.testnet
  const [bitcoinChainData, tunnelManagerData, vaultsData] = await Promise.all([
    getBitcoinChainData(client),
    // @ts-ignore ts(2345)
    getTunnelManagerStatus(client),
    getAllVaultsData(client),
  ])
  return { bitcoinChainData, isTestnet, tunnelManagerData, vaultsData }
}

module.exports = {
  getBtcVaultsData,
}
