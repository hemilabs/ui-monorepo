'use strict'

/**
 * @typedef {object} ClaimData
 * @property {string} amount
 * @property {number} [claimGroupId]
 * @property {string[]} [proof]
 */

/** @type {{[key:string]:ClaimData}} */
const claimData = require('./claim-data.json')

/**
 * @param {object} config
 * @param {number} config.tgeTime
 */
module.exports = function ({ tgeTime }) {
  /**
   * @param {"0x{string}"} address
   * @returns {Promise<ClaimData>}
   */
  async function getUserClaimData(address) {
    const data = claimData[address]
    if (!data) {
      return { amount: '0' }
    }

    if (!tgeTime || Date.now() < tgeTime) {
      return { amount: data.amount }
    }

    return data
  }

  return {
    getUserClaimData,
  }
}
