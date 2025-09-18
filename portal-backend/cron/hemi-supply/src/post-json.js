'use strict'

/**
 * Post JSON data to a resource and return the parsed JSON response.
 *
 * @param {string} resource
 * @param {any} payload
 * @param {{ [key: string]: any }} options
 * @returns {Promise<any>}
 */
async function postJson(resource, payload, options = {}) {
  const res = await fetch(resource, {
    body: JSON.stringify(payload),
    method: 'POST',
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to post JSON: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

module.exports = postJson
