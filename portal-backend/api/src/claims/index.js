'use strict'

/**
 * @typedef {object} ClaimData
 * @property {string} amount
 * @property {number} [claimGroupId]
 * @property {string[]} [proof]
 */

/** @type {{ [key: number]: { [key: string]: ClaimData } }} */
const claimData = {
  43111: require('./claim-data-43111.json'),
  743111: require('./claim-data-743111.json'),
}

/**
 * @param {object} config
 * @param {{ [key: number]: number }} config.tgeTime
 */
module.exports = function ({ tgeTime }) {
  /**
   * @param {number} chainId
   * @param {"0x{string}"} address
   * @returns {Promise<ClaimData>}
   */
  async function getUserClaimData(chainId, address) {
    const data = claimData[chainId][address]
    if (!data) {
      return { amount: '0' }
    }

    if (!tgeTime || Date.now() < tgeTime[chainId]) {
      return { amount: data.amount }
    }

    return data
  }

  return {
    getUserClaimData,
  }
}
