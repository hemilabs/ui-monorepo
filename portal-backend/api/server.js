'use strict'

require('./src/instrument.js')

const config = require('config')
const cors = require('cors')
const express = require('express')
const Sentry = require('@sentry/node')

const { getBtcVaultsData } = require('./src/btc-vaults')
const { getTokenPrices } = require('./src/redis')(config.get('redis'))
const { getTvl } = require('./src/databox')(config.get('tvl.data'))
const { getAllUserClaimData, getUserClaimData } = require('./src/claims')()
const { getUserPoints } = require('./src/absinthe')(config.get('absinthe'))

const globToRegExp = require('./src/glob-to-regexp')
const toMiddleware = require('./src/to-middleware')

const app = express()

/** @type {string} */
const origins = config.get('origins')

/** @type {(string | RegExp)[]} */
const origin = origins.split(',').map(o => (/\*/.test(o) ? globToRegExp(o) : o))

app.use(cors({ origin }))

app.get(
  /\/btc-vaults\/(7?43111)/, // Hemi and Hemi Sepolia only
  toMiddleware(getBtcVaultsData, {
    maxAge: config.get('btcVaults.cacheMin') * 60 * 1000,
  }),
)

app.get(
  /\/points\/(0x[0-9a-fA-F]{40})/,
  toMiddleware(async address => ({ points: await getUserPoints(address) }), {
    revalidate: 60 * 1000,
  }),
)

app.get(
  '/prices',
  toMiddleware(getTokenPrices, {
    revalidate: 60 * 1000,
  }),
)

app.get(
  '/tvl',
  toMiddleware(async () => ({ tvl: await getTvl() }), {
    revalidate: config.get('tvl.revalidateMin') * 60 * 1000,
  }),
)

app.get(
  /\/claims\/(7?43111)\/(0x[0-9a-fA-F]{40})\/all/,
  toMiddleware(getAllUserClaimData, {
    maxAge: 5 * 60 * 1000,
    resolver: (chainId, address) => `${chainId}:${address}`,
  }),
)

app.get(
  /\/claims\/(7?43111)\/(0x[0-9a-fA-F]{40})/,
  toMiddleware(getUserClaimData, {
    maxAge: 5 * 60 * 1000,
    resolver: (chainId, address) => `${chainId}:${address}`,
  }),
)

app.use(function (req, res) {
  res.status(404).send({ error: 'Not Found' })
})

Sentry.setupExpressErrorHandler(app)

// eslint-disable-next-line no-unused-vars
app.use(function (error, req, res, next) {
  console.error('Internal Server Error:', error)
  res.status(500).send({ error: 'Internal Server Error' })
})

const port = config.get('port')
app.listen(port, function () {
  const version = config.get('version')
  console.log(`Portal backend v${version} running on port ${port}`)
  console.debug(`Config: ${JSON.stringify(config.util.toObject())}`)
})
