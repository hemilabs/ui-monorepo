'use strict'

const postJson = require('./post-json')

module.exports = function ({ apiKey, apiUrl }) {
  async function getUserPoints(address) {
    const { data, errors } = await postJson(
      apiUrl,
      {
        query: `query ($address: String!) {
                query_address_points(args: { address: $address, client_season: "hemi" }) {
                  points
                }
              }`,
        variables: { address },
      },
      { headers: { Authorization: `Bearer ${apiKey}` } },
    )
    if (errors && errors.length) {
      const messages = errors.map(err => err.message).join(', ')
      throw new Error(`Points query failed: ${messages}`)
    }

    return data?.query_address_points[0]?.points || 0
  }

  return {
    getUserPoints,
  }
}
