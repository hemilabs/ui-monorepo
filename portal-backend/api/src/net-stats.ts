import fetchJson from 'tiny-fetch-json'

import { jsonRpc } from './json-rpc.ts'

async function getBlockNumber(rpcUrl: string) {
  const blockNumber = (await jsonRpc(rpcUrl, 'eth_blockNumber')) as string
  return parseInt(blockNumber, 16)
}

async function getTotalTransactions() {
  const stats = (await fetchJson('https://explorer.hemi.xyz/api/v2/stats')) as {
    total_transactions: string
  }
  return parseInt(stats.total_transactions)
}

export type NetStatsOptions = { hemi: string }

function createNetStats(rpcUrl: NetStatsOptions) {
  async function getNetStats() {
    const [blockNumber, totalTransactions] = await Promise.all([
      getBlockNumber(rpcUrl.hemi),
      getTotalTransactions(),
    ])
    return {
      'btc-transactions': totalTransactions.toString(),
      'latest-keystone': blockNumber.toString(),
      'timestamp': new Date().getTime(),
    }
  }

  return {
    getNetStats,
  }
}

export { createNetStats }
