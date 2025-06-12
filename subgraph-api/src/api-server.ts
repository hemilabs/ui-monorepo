/* eslint-disable promise/no-callback-in-promise */

import config from 'config'
import cors from 'cors'
import express from 'express'
import { hemi, hemiSepolia } from 'hemi-viem'
import { mainnet, sepolia } from 'viem/chains'

import { getWithdrawalProofAndClaimHandler } from './route-handlers/get-withdrawal-proof-and-claim.ts'
import {
  getBtcWithdrawals,
  getEvmDeposits,
  getEvmWithdrawals,
  getLastIndexedBlock,
  getTotalStaked,
} from './subgraph.ts'
import { sendJsonResponse } from './utils.ts'

function parseChainId(req, res, next) {
  const { chainIdStr } = req.params
  req.data = req.data || {}
  req.data.chainId = parseInt(chainIdStr)
  next()
}

function validateChainIsEthereum(req, res, next) {
  if ([mainnet.id, sepolia.id].includes(req.data.chainId)) {
    next()
  } else {
    next('route')
  }
}

function validateChainIsHemi(req, res, next) {
  if ([hemi.id, hemiSepolia.id].includes(req.data.chainId)) {
    next()
  } else {
    next('route')
  }
}

const isInteger = string => /^\d+$/.test(string)

function parseQueryParams(req, res, next) {
  const { fromBlock = '0', limit, skip } = req.query

  req.data = req.data || {}

  if (!isInteger(fromBlock)) {
    sendJsonResponse(res, 400, { error: 'fromBlock must be a number' })
    return
  }
  req.data.fromBlock = Number.parseInt(fromBlock)

  if (limit) {
    if (!isInteger(limit)) {
      sendJsonResponse(res, 400, { error: 'limit must be a number' })
      return
    }
    req.data.limit = Number.parseInt(limit)
  }

  if (skip) {
    if (!isInteger(skip)) {
      sendJsonResponse(res, 400, { error: 'skip must be a number' })
      return
    }
    req.data.skip = Number.parseInt(skip)
  }

  next()
}

export function createApiServer() {
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
      // @ts-expect-error: req.data.chainId is set in parseChainId
      const { chainId } = req.data

      getLastIndexedBlock(chainId)
        .then(function (number) {
          sendJsonResponse(res, 200, { number })
        })
        .catch(next)
    },
  )

  app.get(
    '/:chainIdStr(\\d+)/deposits/:address(0x[0-9a-fA-F]{40})',
    parseChainId,
    validateChainIsEthereum,
    parseQueryParams,
    function (req, res, next) {
      const { address } = req.params

      // @ts-expect-error: req.data is populated by parseChainId and parseQueryParams
      getEvmDeposits({ address, ...req.data })
        .then(function (deposits) {
          sendJsonResponse(res, 200, { deposits })
        })
        .catch(next)
    },
  )

  app.get(
    '/:chainIdStr(\\d+)/hashedWithdrawals/:hash',
    parseChainId,
    validateChainIsEthereum,
    getWithdrawalProofAndClaimHandler,
  )

  app.get(
    '/:chainIdStr(\\d+)/withdrawals/:address(0x[0-9a-fA-F]{40})/:type(btc|evm)',
    parseChainId,
    validateChainIsHemi,
    parseQueryParams,
    function (req, res, next) {
      const { address, type } = req.params

      let getWithdrawals
      if (type === 'evm') {
        getWithdrawals = getEvmWithdrawals
      } else {
        getWithdrawals = getBtcWithdrawals
      }

      // @ts-expect-error: req.data is populated by parseChainId and parseQueryParams
      getWithdrawals({ address, ...req.data })
        .then(function (withdrawals) {
          sendJsonResponse(res, 200, { withdrawals })
        })
        .catch(next)
    },
  )

  app.get(
    '/:chainIdStr(\\d+)/staked',
    parseChainId,
    validateChainIsHemi,
    function (req, res, next) {
      // @ts-expect-error: req.data.chainId is set in parseChainId
      const { chainId } = req.data

      getTotalStaked(chainId)
        .then(function (staked) {
          sendJsonResponse(res, 200, { staked })
        })
        .catch(next)
    },
  )

  app.use(function (req, res) {
    sendJsonResponse(res, 404, { error: 'Not Found' })
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use(function (err, req, res, next) {
    if (config.get('debug')) {
      // eslint-disable-next-line no-console
      console.log(err)
    }
    sendJsonResponse(res, 500, { error: 'Internal Server Error' })
  })

  return app
}
