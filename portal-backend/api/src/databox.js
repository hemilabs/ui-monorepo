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
    // Since the Databox API now requires a password, fetching the TVL is a 2-step flow:
    // First, the fetch uses the password as query string. The response contains a temporary token.
    // Then, the token is used to fetch the actual TVL data, again using query string.
    const { cookie: tempPassword, password: status } = await fetchWithPassword(
      url,
      password,
    )
    if (status !== 'success') {
      throw new Error(
        `Failed to fetch TVL data from Databox. Status is ${status}`,
      )
    }
    const { samples } = await fetchWithPassword(url, tempPassword)
    const { data } = samples.find(s => s.id === sampleId).sampledata.dsData[0]
    // there should always be one item
    return data[0].items[0].value
  }

  return {
    getTvl,
  }
}
