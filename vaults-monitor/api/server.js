'use strict'

const { hemi, hemiSepolia } = require('hemi-viem')
const cors = require('cors')
const express = require('not-express')
const pMemoize = require('promise-mem')

const { getBtcVaultsData } = require('./src/btc-vaults')

const cacheMinutesStr = process.env.CACHE_MINUTES || '1'
const chain = process.env.CHAIN || 'mainnet'
const originsStr = process.env.ORIGINS || `http://localhost:3000`
const portStr = process.env.PORT || '3004'

const chainId = chain === 'mainnet' ? hemi.id : hemiSepolia.id
const maxAge = Number.parseInt(cacheMinutesStr) * 60 * 1000
const limitedGetBtcVaultsData = pMemoize(getBtcVaultsData, { maxAge })

// Given we only need to parse origins (<protocol>//<domain>) that may contain a
// star (glob pattern format), we only need to escape dots and convert stars to
// regex patterns in that case.
const globToRegExp = origin =>
  /\*/.test(origin)
    ? new RegExp(`^${origin.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`)
    : origin

const app = express()
app.use(cors({ origin: originsStr.split(',').map(globToRegExp) }))

app.get('/', async function (req, res) {
  const vaultsData = await limitedGetBtcVaultsData(chainId)
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(vaultsData))
})

app.listen(Number.parseInt(portStr))
console.log(`API server listening on port ${portStr}`)
