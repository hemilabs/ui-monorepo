'use strict'

const jsonRpc = require('./json-rpc')

/**
 * Make an Ethereum JSON-RPC call to a contract.
 *
 * @param {string} rpcUrl
 * @param {string} to
 * @param {string} data
 * @returns {Promise<any>}
 */
const ethCall = (rpcUrl, to, data) =>
  jsonRpc(rpcUrl, 'eth_call', [{ data, to }, 'latest'])

module.exports = ethCall
