'use strict'

const pRetry = require('p-retry')

const postJson = require('./post-json')

module.exports = function ({ apiKey, apiUrl }) {
  async function getUserPoints(address) {
    try {
      const query = () =>
        postJson(
          apiUrl,
          {
            query: `query ($address: String!) {
                    query_address_points(args: { 
                      address: $address, 
                      client_season: "hemi" 
                    }) {
                      points
                    }
                  }`,
            variables: { address },
          },
          { headers: { Authorization: `Bearer ${apiKey}` } },
        )
      const { data, errors } = await pRetry(query)
      if (errors && errors.length) {
        const messages = errors.map(err => err.message).join(', ')
        throw new Error(messages)
      }

      return data?.query_address_points[0]?.points || 0
    } catch (err) {
      throw new Error(`Points query failed: ${err.message}`)
    }
  }

  return {
    getUserPoints,
  }
}
