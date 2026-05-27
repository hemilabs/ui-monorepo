import { setupExpressErrorHandler } from '@sentry/node'
import config from 'config'
import cors from 'cors'
import express, { type ErrorRequestHandler, type RequestHandler } from 'express'

import { getBtcVaultsData } from './src/btc-vaults.ts'
import { createClaims } from './src/claims.ts'
import { createDune, type DuneOptions } from './src/dune.ts'
import { globToRegExp } from './src/glob-to-regexp.ts'
import { createNetStats, type NetStatsOptions } from './src/net-stats.ts'
import { createRedisCache, type RedisOptions } from './src/redis.ts'
import { toJsonMiddleware, toTextMiddleware } from './src/to-middleware.ts'
import { createVeHemi } from './src/ve-hemi/index.ts'

const { getTvl } = createDune(config.get<DuneOptions>('tvl.dune'))
const { getAllUserClaimData } = createClaims()
const { getNetStats } = createNetStats(config.get<NetStatsOptions>('rpcUrl'))
const cache = createRedisCache(config.get<RedisOptions>('redis'))

const { getVeHemiRewards } = createVeHemi({ cache })

const app = express()

app.disable('x-powered-by')

const origins = config.get<string>('origins')

const origin = origins.split(',').map(o => (/\*/.test(o) ? globToRegExp(o) : o))

app.use(cors({ origin }))

app.get(
  /\/btc-vaults\/(7?43111)/, // Hemi and Hemi Sepolia only
  toJsonMiddleware(getBtcVaultsData, {
    maxAge: config.get<number>('btcVaults.cacheMin') * 60 * 1000,
  }),
)

app.get(
  '/circulating',
  toTextMiddleware(cache.getCirculatingSupply, {
    revalidate: 5 * 60 * 1000,
  }),
)

app.get(
  /\/claims\/(7?43111)\/(0x[0-9a-fA-F]{40})\/all/,
  toJsonMiddleware(getAllUserClaimData, {
    maxAge: 5 * 60 * 1000,
    resolver: (chainId, address) => `${chainId}:${address}`,
  }),
)

app.get(
  '/net-stats',
  toJsonMiddleware(getNetStats, {
    maxAge: 60 * 60 * 1000,
  }),
)

app.get(
  '/prices',
  toJsonMiddleware(cache.getTokenPrices, {
    revalidate: 60 * 1000,
  }),
)

app.get(
  '/tvl',
  toJsonMiddleware(async () => ({ tvl: await getTvl() }), {
    revalidate: config.get<number>('tvl.revalidateMin') * 60 * 1000,
  }),
)

app.get(
  /\/ve-hemi-rewards\/(7?43111)/,
  toJsonMiddleware(getVeHemiRewards, {
    revalidate: 4 * 60 * 60 * 1000, // 4 hours
  }),
)

const notFoundHandler: RequestHandler = function (req, res) {
  res.status(404).send({ error: 'Not Found' })
}
app.use(notFoundHandler)

setupExpressErrorHandler(app)

const errorHandler: ErrorRequestHandler = function (error, _req, res, _next) {
  console.error('Internal Server Error:', error)
  res.status(500).send({ error: 'Internal Server Error' })
}
app.use(errorHandler)

const port = config.get<number>('port')
app.listen(port, function () {
  const version = config.get<string>('version')
  console.log(`Portal backend v${version} running on port ${port}`)
})
