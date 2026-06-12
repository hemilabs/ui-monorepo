import { esploraClient } from 'esplora-client'
import {
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
} from 'hemi-viem'
import { type Address, createPublicClient, http, type PublicClient } from 'viem'

function getHemiClient(chainId: string) {
  const chain = { [hemi.id]: hemi, [hemiSepolia.id]: hemiSepolia }[
    Number(chainId)
  ]
  return createPublicClient({ chain, transport: http() }) as PublicClient
}

async function getBitcoinChainHeight(network: 'testnet' | 'mainnet') {
  const client = esploraClient({ network })
  const height = await client.bitcoin.blocks.getBlocksTipHeight()
  return { height }
}

async function getBitcoinChainData(client: PublicClient) {
  const [bitcoin, bitcoinKit] = await Promise.all([
    getBitcoinChainHeight(client.chain!.testnet ? 'testnet' : 'mainnet'),
    getBitcoinChainLastHeader(client),
  ])
  return {
    bitcoin,
    bitcoinKit,
  }
}

async function getBitcoinAddressBalance(
  network: 'testnet' | 'mainnet',
  address: string,
) {
  const client = esploraClient({ network })
  const addressData = await client.bitcoin.addresses.getAddress({ address })
  return (
    addressData.chain_stats.funded_txo_sum -
    addressData.chain_stats.spent_txo_sum
  )
}

async function getVaultBitcoinBalanceData(
  client: PublicClient,
  { vaultAddress }: { vaultAddress: Address },
) {
  const bitcoinCustodyAddress = await getBitcoinCustodyAddress(client, {
    vaultAddress,
  })
  const balanceSats = bitcoinCustodyAddress
    ? await getBitcoinAddressBalance(
        client.chain!.testnet ? 'testnet' : 'mainnet',
        bitcoinCustodyAddress,
      )
    : 0
  return { balanceSats, bitcoinCustodyAddress }
}

async function getVaultPendingWithdrawalsData(
  client: PublicClient,
  { vaultAddress }: { vaultAddress: Address },
) {
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

async function getVaultData(
  client: PublicClient,
  { vaultIndex }: { vaultIndex: number },
) {
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

async function getAllVaultsData(client: PublicClient) {
  const length = await getVaultCounter(client)
  return Promise.all(
    Array.from({ length }, (_, i) => getVaultData(client, { vaultIndex: i })),
  )
}

async function getBtcVaultsData(chainId: string) {
  const client = getHemiClient(chainId)
  const isTestnet = client.chain!.testnet
  const [bitcoinChainData, tunnelManagerData, vaultsData] = await Promise.all([
    getBitcoinChainData(client),
    getTunnelManagerStatus(client),
    getAllVaultsData(client),
  ])
  return { bitcoinChainData, isTestnet, tunnelManagerData, vaultsData }
}

export { getBtcVaultsData }
