'use strict'

const fetchJson = require('tiny-fetch-json')
const jsonRpc = require('./json-rpc')

async function getBlockNumber(rpcUrl) {
  const blockNumber = await jsonRpc(rpcUrl, 'eth_blockNumber')
  return parseInt(blockNumber, 16)
}

async function getTotalTransactions() {
  const stats = await fetchJson('https://explorer.hemi.xyz/api/v2/stats')
  return parseInt(stats.total_transactions)
}

/**
 * @param {object} rpcUrl
 * @param {string} rpcUrl.hemi
 */
module.exports = function (rpcUrl) {
  /**
   * @returns {Promise<{ 'btc-transactions': string, 'latest-keystone': string, timestamp: number }>}
   */
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
