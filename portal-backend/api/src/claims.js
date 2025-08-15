'use strict'

const fetchJson = require('tiny-fetch-json')
const pSwr = require('promise-swr')

const memoizedFetchJson = pSwr(fetchJson, {
  maxAge: 60 * 60 * 1000,
  revalidate: 5 * 60 * 1000,
})

/**
 * @param {{ [key: number]: { dataUrl: string, tgeTime: number } }} config
 */
module.exports = function (config) {
  /**
   * @typedef {object} ClaimData
   * @property {string} amount
   * @property {number} [claimGroupId]
   * @property {string[]} [proof]
   */

  /**
   * @param {number} chainId
   * @param {"0x{string}"} address
   * @returns {Promise<ClaimData>}
   */
  async function getUserClaimData(chainId, address) {
    const { dataUrl, tgeTime } = config[chainId]

    /** @type {{ [address: string]: ClaimData }} */
    const allData = await memoizedFetchJson(dataUrl)
    const userData = allData[address]
    if (!userData) {
      return { amount: '0' }
    }

    if (!tgeTime || Date.now() < tgeTime[chainId]) {
      return { amount: userData.amount }
    }

    return userData
  }

  return {
    getUserClaimData,
  }
}
