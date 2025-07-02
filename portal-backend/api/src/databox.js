'use strict'

const fetchJson = require('tiny-fetch-json')

const sumBy = require('./sum-by')

/**
 * @param {object} config
 * @param {number} config.sampleId - The sample id to look for.
 * @param {string} config.url - The Databox endpoint.
 */
module.exports = function ({ sampleId, url }) {
  /**
   * Fetches TVL from Databox.
   *
   * @returns {Promise<number>} The TVL.
   * @throws {Error} If the fetch fails or any structure is missing or invalid.
   */
  async function getTvl() {
    const { samples } = await fetchJson(url)
    const { data } = samples.find(s => s.id === sampleId).sampledata.dsData[0]
    return data.reduce(
      sumBy(i => i.items[0].value),
      0,
    )
  }

  return {
    getTvl,
  }
}
