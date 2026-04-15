'use strict'

const fetchJson = require('tiny-fetch-json')

/**
 * @typedef {object} ResultRow
 * @property {number} balance_usd
 * @property {string} week
 *
 * @typedef {object} DuneResponse
 * @property {object} result
 * @property {ResultRow[]} result.rows
 */

/**
 * @param {object} config
 * @param {string} config.apiKey - The API key for the Dune API.
 * @param {string} config.queryId - The query ID for the Dune API.
 */
module.exports = function ({ apiKey, queryId }) {
  /**
   * Fetches TVL from Dune.
   *
   * The query returns the raw data as rows and columns but only the balances of
   * the last queried week are considered. Each row contains the balance in USD
   * of a token and there are currently only 19 tokens. To save on resources,
   * only the relevant columns and a limited number of rows (50) are requested.
   * The results are returned sorted by week in descending order, so the most
   * recent week is always the first row.
   *
   * @returns {Promise<number>} The TVL.
   * @throws {Error} If the fetch fails or any structure is missing or invalid.
   */
  async function getTvl() {
    try {
      const response = /** @type {DuneResponse} */ (
        await fetchJson(
          `https://api.dune.com/api/v1/query/${queryId}/results` +
            '?columns=balance_usd,week' +
            '&limit=50',
          { headers: { 'x-dune-api-key': apiKey } },
        )
      )
      if (!response.result.rows.length) {
        throw new Error('No rows returned')
      }
      const week = response.result.rows[0].week
      return response.result.rows
        .filter(r => r.week === week)
        .map(r => r.balance_usd)
        .reduce((sum, b) => sum + b, 0)
    } catch (err) {
      console.warn(
        `Failed to fetch TVL data from Dune: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`,
      )
      throw err
    }
  }

  return {
    getTvl,
  }
}
