'use strict'

const postJson = require('./post-json')

/**
 * Make a JSON-RPC call.
 *
 * @param {string} url
 * @param {string} method
 * @param {Array<any>} params
 * @returns {Promise<any>}
 */
async function jsonRpc(url, method, params = []) {
  const res = await postJson(url, {
    id: Date.now(),
    jsonrpc: '2.0',
    method,
    params,
  })
  if (res.error) {
    throw new Error(`JSON-RPC error: ${res.error.code} ${res.error.message}`)
  }
  return res.result
}

module.exports = jsonRpc
