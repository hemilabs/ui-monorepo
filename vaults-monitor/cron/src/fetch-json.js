'use strict'

/**
 * Fetches JSON data from a URL with optional extra headers.
 *
 * @param {string} url - The URL
 * @param {Object} [extraHeaders] - Additional headers to include in the request
 * @returns {Promise<any>} The parsed JSON response
 */
async function fetchJson(url, extraHeaders) {
  const headers = { accept: 'application/json', ...extraHeaders }
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`Failed to fetch JSON: ${res.statusText}`)
  }
  return res.json()
}

module.exports = fetchJson
