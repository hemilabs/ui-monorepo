'use strict'

const http = require('http')
const safeAsyncFn = require('safe-async-fn')

const absintheApiKey = process.env.ABSINTHE_API_KEY
const absintheApiUrl =
  process.env.ABSINTHE_API_URL || 'https://gql3.absinthe.network/v1/graphql'
const port = Number.parseInt(process.env.PORT || '3002')
const originsStr = process.env.ORIGINS || 'http://localhost:3000'
const origins = originsStr.split(',')

async function getUserPoints(address) {
  const res = await fetch(absintheApiUrl, {
    body: JSON.stringify({
      query: `query ($address: String!) {
                query_address_points(args: { address: $address, client_season: "hemi" }) {
                  points
                }
              }`,
      variables: { address },
    }),
    headers: {
      'Authorization': `Bearer ${absintheApiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
  if (!res.ok) {
    throw new Error(`Points query failed: ${res.statusText}`)
  }

  const { data, errors } = await res.json()
  if (errors && errors.length) {
    const messages = errors.map(err => err.message).join(', ')
    throw new Error(`Points query errored: ${messages}`)
  }

  return data?.query_address_points[0]?.points || 0
}

const safeGetUserPoints = safeAsyncFn(getUserPoints)

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

  const address = req.url.slice(1)
  if (!/^0x[0-9a-f]{40}$/i.test(address)) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid address format' }))
    return
  }

  let statusCode, response
  const [err, points] = await safeGetUserPoints(address)
  if (err) {
    // eslint-disable-next-line no-console
    console.error(`Failed to handle request: ${err}`)
    statusCode = 500
    response = { error: 'Internal Server Error' }
  } else {
    statusCode = 200
    response = { points }
  }

  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(response))
}

http.createServer(handleRequest).listen(port)
