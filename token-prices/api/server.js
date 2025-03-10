'use strict'

const http = require('http')
const pLimitOne = require('promise-limit-one')
const redis = require('redis')

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
const portStr = process.env.PORT || '3001'
const port = parseInt(portStr)
const originsStr = process.env.ORIGINS || 'http://localhost:3000'
const origins = originsStr.split(',')

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

async function handleRequest(req, res) {
  const { 'access-control-request-headers': headers, origin } = req.headers
  if (headers) {
    res.setHeader('Access-Control-Allow-Headers', headers)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  const allowOrigin = origins.includes(origin) ? origin : false
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method Not Allowed' }))
    return
  }

  if (req.url !== '/') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not Found' }))
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

http.createServer(handleRequest).listen(port)
