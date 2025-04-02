import { hemi, hemiSepolia } from 'hemi-viem'
import { mainnet, sepolia } from 'viem/chains'
import config from 'config'
import cors from 'cors'
import express from 'express'

import {
  getBtcWithdrawals,
  getEvmDeposits,
  getEvmWithdrawals,
  getLastIndexedBlock,
  getTotalStaked,
} from './subgraph.ts'

function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function parseChainId(req, res, next) {
  const { chainIdStr } = req.params
  req.params.chainId = parseInt(chainIdStr)
  next()
}

function validateChainIsEthereum(req, res, next) {
  if ([mainnet.id, sepolia.id].includes(req.params.chainId)) {
    next()
  } else {
    next('route')
  }
}

function validateChainIsHemi(req, res, next) {
  if ([hemi.id, hemiSepolia.id].includes(req.params.chainId)) {
    next()
  } else {
    next('route')
  }
}

function parseAsInteger(req, property) {
  const string = req.query[property]
  if (!string) {
    return
  }

  if (!/^\d+$/.test(string)) {
    throw new Error(`${property} must be a number`)
  }

  req.validatedQuery[property] = Number.parseInt(string)
}

function validateQueryParams(req, res, next) {
  try {
    req.validatedQuery = {}
    parseAsInteger(req, 'fromBlock')
    parseAsInteger(req, 'limit')
    parseAsInteger(req, 'skip')
    next()
  } catch (err) {
    sendJsonResponse(res, 400, { error: err.message })
  }
}

export function createServer() {
  const app = express()

  app.use(cors({ origin: config.get('originList') }))

  app.get(
    '/:chainIdStr(\\d+)/:operation(deposits|withdrawals)/meta',
    parseChainId,
    function (req, res, next) {
      const { operation } = req.params
      if (operation === 'deposits') {
        validateChainIsEthereum(req, res, next)
      } else {
        validateChainIsHemi(req, res, next)
      }
    },
    function (req, res, next) {
      const { chainId } = req.params

      // @ts-expect-error: chainId is a number
      getLastIndexedBlock(chainId)
        .then(function (number) {
          sendJsonResponse(res, 200, { number })
        })
        // eslint-disable-next-line promise/no-callback-in-promise
        .catch(next)
    },
  )

  app.get(
    '/:chainIdStr(\\d+)/deposits/:address(0x[0-9a-fA-F]{40})',
    parseChainId,
    validateChainIsEthereum,
    validateQueryParams,
    function (req, res, next) {
      const { chainId, address } = req.params

      // @ts-expect-error: req.validatedQuery is populated by parseQueryParams
      getEvmDeposits({ address, chainId, ...req.validatedQuery })
        .then(function (deposits) {
          sendJsonResponse(res, 200, { deposits })
        })
        // eslint-disable-next-line promise/no-callback-in-promise
        .catch(next)
    },
  )

  app.get(
    '/:chainIdStr(\\d+)/withdrawals/:address(0x[0-9a-fA-F]{40})/:type(btc|evm)',
    parseChainId,
    validateChainIsHemi,
    validateQueryParams,
    function (req, res, next) {
      const { chainId, address, type } = req.params

      let getWithdrawals
      if (type === 'evm') {
        getWithdrawals = getEvmWithdrawals
      } else {
        getWithdrawals = getBtcWithdrawals
      }

      // @ts-expect-error: req.validatedQuery is populated by parseQueryParams
      getWithdrawals({ address, chainId, ...req.validatedQuery })
        .then(function (withdrawals) {
          sendJsonResponse(res, 200, { withdrawals })
        })
        // eslint-disable-next-line promise/no-callback-in-promise
        .catch(next)
    },
  )

  app.get(
    '/:chainIdStr(\\d+)/staked',
    parseChainId,
    validateChainIsHemi,
    function (req, res, next) {
      const { chainId } = req.params

      // @ts-expect-error: chainId is a number
      getTotalStaked(chainId)
        .then(function (staked) {
          sendJsonResponse(res, 200, { staked })
        })
        // eslint-disable-next-line promise/no-callback-in-promise
        .catch(next)
    },
  )

  app.use(function (req, res) {
    sendJsonResponse(res, 404, { error: 'Not Found' })
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use(function (err, req, res, next) {
    if (config.get('DEBUG')) {
      // eslint-disable-next-line no-console
      console.log(err)
    }
    sendJsonResponse(res, 500, {
      error: 'Internal Server Error',
    })
  })

  return app
}
