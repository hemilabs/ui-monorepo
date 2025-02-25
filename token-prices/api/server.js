'use strict'

const http = require('http')
const pLimitOne = require('promise-limit-one')
const redis = require('redis')

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
const portStr = process.env.PORT || '3000'
const port = parseInt(portStr)

const client = redis.createClient({ url: redisUrl })
client.connect()

const getPricesFromCache = pLimitOne(async function () {
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
})

async function requestHandler(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405)
    res.end()
    return
  }

  let statusCode, data
  try {
    statusCode = 200
    data = await getPricesFromCache()
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Failed to handle request: ${err}`)
    statusCode = 500
    data = { error: 'Internal Server Error' }
  }

  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

http.createServer(requestHandler).listen(port)
