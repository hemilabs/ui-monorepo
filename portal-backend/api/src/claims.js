'use strict'

const fs = require('fs')
const path = require('path')

/**
 * @typedef {object} ClaimData
 * @property {string} amount
 * @property {number} [claimGroupId]
 * @property {string[]} [proof]
 *
 * @typedef {`0x{string}`} Address
 * @typedef {{ [address: string]: ClaimData }} Distribution
 * @typedef {{ [claimGroupId: number]: Distribution }} ChainDistributions
 */

const localData = /** @type {{ [chainId: number]: ChainDistributions }} */ ({})
const dataDir = path.join(__dirname, 'claims-data')
const files = fs.readdirSync(dataDir)
files.forEach(function (file) {
  const match = file.match(/^(\d+)-(\d+)\.json$/)
  if (!match) {
    return
  }

  const chainId = Number(match[1])
  const claimGroupId = Number(match[2])
  const filePath = path.join(dataDir, file)
  const distribution = require(filePath)
  if (!localData[chainId]) {
    localData[chainId] = {}
  }
  localData[chainId][claimGroupId] = distribution
})

module.exports = function () {
  /**
   * @param {number} chainId
   * @param {Address} address
   * @returns {Promise<ClaimData[]>}
   */
  const getAllUserClaimData = async (chainId, address) =>
    Object.entries(localData[chainId] || {}).map(function ([
      claimGroupId,
      claimGroup,
    ]) {
      const data = claimGroup[address]
      return data
        ? data
        : { amount: '0', claimGroupId: Number(claimGroupId), proof: [] }
    })

  return {
    getAllUserClaimData,
  }
}
