'use strict'

const fetchJson = require('tiny-fetch-json')

const fetchWithPassword = (url, password) =>
  fetchJson(`${url}?password=${password}`)

/**
 * @param {object} config
 * @param {string} config.password - The password for the Databox API.
 * @param {number} config.sampleId - The sample id to look for.
 * @param {string} config.url - The Databox endpoint.
 */
module.exports = function ({ password, sampleId, url }) {
  /**
   * Fetches TVL from Databox.
   *
   * @returns {Promise<number>} The TVL.
   * @throws {Error} If the fetch fails or any structure is missing or invalid.
   */
  async function getTvl() {
    try {
      // Since the Databox API now requires a password, fetching the TVL is a
      // 2-step flow: First, use the password as query string. The response
      // contains a cookie. Then, use the cookie to fetch the actual TVL data.
      const { cookie, password: res } = await fetchWithPassword(url, password)
      if (res !== 'success') {
        throw new Error(`Status is ${res}`)
      }

      const { samples } = await fetchWithPassword(url, cookie)
      const sample = samples.find(s => s.id === sampleId)

      if (!sample) {
        // This is expected to happen almost every day when not more than once
        // per day. Let's log it as info to prevent triggering alerts.
        console.info(`Sample with id ${sampleId} not found`)
        throw new Error('Sample not found')
      }

      return sample.sampledata.dsData[0].data[0].items[0].value
    } catch (err) {
      console.warn(`Failed to fetch TVL data from Databox: ${err}`)
      throw err
    }
  }

  return {
    getTvl,
  }
}
