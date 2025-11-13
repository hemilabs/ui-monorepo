'use strict'

const { erc20Abi } = require('viem')
const { readContract } = require('viem/actions')

/**
 * @param {import('viem').Client} client
 * @param {import('viem').Address} address
 */
const getTokenDecimals = async (client, address) =>
  readContract(client, {
    abi: erc20Abi,
    address,
    args: [],
    functionName: 'decimals',
  })

/**
 * @param {import('viem').Client} client
 * @param {import('viem').Address} address
 */
const getTokenSymbol = async (client, address) =>
  readContract(client, {
    abi: erc20Abi,
    address,
    args: [],
    functionName: 'symbol',
  })

module.exports = {
  getTokenDecimals,
  getTokenSymbol,
}
