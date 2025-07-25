'use strict'

const cors = require('cors')
const express = require('not-express')

const config = require('./src/config')

const { getBtcVaultsData } = require('./src/btc-vaults')
const { getTokenPrices } = require('./src/redis')(config.get('redis'))
const { getTvl } = require('./src/databox')(config.get('tvl.data'))
const { getUserPoints } = require('./src/absinthe')(config.get('absinthe'))

const globToRegExp = require('./src/glob-to-regexp')
const toMiddleware = require('./src/to-middleware')

const app = express()

const origin = config
  .get('origins')
  .split(',')
  .map(o => (/\*/.test(o) ? globToRegExp(o) : o))

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

app.get('/prices', toMiddleware(getTokenPrices), {
  revalidate: 60 * 1000,
})

app.get(
  '/tvl',
  toMiddleware(async () => ({ tvl: await getTvl() }), {
    revalidate: config.get('tvl.revalidateMin') * 60 * 1000,
  }),
)

const port = config.get('port')
app.listen(port)
console.log(`API server listening on port ${port}`)
