'use strict'

const fetchJson = require('tiny-fetch-json')

const sumBy = require('./sum-by')

/**
 * Fetches TVL from Databox.
 *
 * @param {string} url - The Databox endpoint.
 * @param {number} sampleId - The sample id to look for.
 * @returns {Promise<number>} The TVL.
 * @throws {Error} If the fetch fails or any structure is missing or invalid.
 */
async function getTvl(url, sampleId) {
  const { samples } = await fetchJson(url)
  const { data } = samples.find(s => s.id === sampleId).sampledata.dsData[0]
  return data.reduce(
    sumBy(i => i.items[0].value),
    0,
  )
}

module.exports = {
  getTvl,
}
