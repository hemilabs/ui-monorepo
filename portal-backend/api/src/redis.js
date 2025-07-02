'use strict'

const redis = require('redis')

module.exports = function ({ url }) {
  const client = redis.createClient({ url })
  client.connect()

  async function getTokenPrices() {
    const data = { prices: {} }
    const prefix = 'price:'
    // Even when it is not recommended to use KEYS in production, it is used
    // here because the number of keys is expected to be small and the solution
    // is simple. The alternative would have been to SCAN the keys, walk through
    // the cursor and fetch the values for each key. This would have been more
    // complex.
    const keys = await client.keys(`${prefix}*`)
    const values = await client.mGet(keys.concat('time'))
    const time = values.pop()
    if (time) {
      data['time'] = new Date(Number.parseInt(time)).toISOString()
    }
    keys.forEach(function (key, i) {
      data.prices[key.slice(prefix.length)] = values[i]
    })
    return data
  }

  return {
    getTokenPrices,
  }
}
