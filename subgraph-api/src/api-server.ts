/* eslint-disable promise/no-callback-in-promise */

import config from 'config'
import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import { Address } from 'viem'
import { hemi, hemiSepolia, mainnet, sepolia } from 'viem/chains'

import { ChainIdPathParams, ReqData } from '../types/server.ts'

import { getBtcDepositOnHemi } from './route-handlers/get-btc-deposit-on-hemi.ts'
import { getClaimTransactionHandler } from './route-handlers/get-claim-transaction-hash.ts'
import { getLockedPositionsHandler } from './route-handlers/get-locked-positions.ts'
import { getWithdrawalProofAndClaimHandler } from './route-handlers/get-withdrawal-proof-and-claim.ts'
import {
  getBtcWithdrawals,
  getEvmDeposits,
  getEvmWithdrawals,
  getLastIndexedBlock,
  getTotalStaked,
} from './subgraph.ts'
import { isInteger, sendJsonResponse, asyncHandler } from './utils.ts'

function parseChainId(
  req: Request<ChainIdPathParams> & ReqData,
  res: Response,
  next: NextFunction,
) {
  const { chainIdStr } = req.params
  req.data = req.data || {}
  req.data.chainId = parseInt(chainIdStr)
  next()
}

function validateChainIsEthereum(
  req: Request & ReqData,
  res: Response,
  next: NextFunction,
) {
  if (req.data.chainId && [mainnet.id, sepolia.id].includes(req.data.chainId)) {
    next()
  } else {
    next('route')
  }
}

function validateChainIsHemi(
  req: Request & ReqData,
  res: Response,
  next: NextFunction,
) {
  if (
    req.data.chainId &&
    [hemi.id, hemiSepolia.id].includes(req.data.chainId)
  ) {
    next()
  } else {
    next('route')
  }
}

type QueryParams = {
  fromBlock?: string
  limit?: string
  skip?: string
}
function parseQueryParams(
  req: Request<object, object, object, QueryParams> & ReqData,
  res: Response,
  next: NextFunction,
) {
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

  app.use(cors({ origin: config.get<string[]>('originList') }))

  app.get(
    '/:chainIdStr(\\d+)/:operation(deposits|withdrawals)/meta',
    parseChainId,
    function (req: Request & ReqData, res: Response, next: NextFunction) {
      const { operation } = req.params
      if (operation === 'deposits') {
        validateChainIsEthereum(req, res, next)
      } else {
        validateChainIsHemi(req, res, next)
      }
    },
    function (req: Request & ReqData, res: Response, next: NextFunction) {
      const { chainId } = req.data

      getLastIndexedBlock(chainId)
        .then(function (number) {
          sendJsonResponse(res, 200, { number })
        })
        .catch(next)
    },
  )

  app.get(
    '/:chainIdStr(\\d+)/deposits/:hash/btc',
    parseChainId,
    validateChainIsHemi,
    asyncHandler(getBtcDepositOnHemi),
  )

  app.get(
    '/:chainIdStr(\\d+)/deposits/:address(0x[0-9a-fA-F]{40})',
    parseChainId,
    validateChainIsEthereum,
    parseQueryParams,
    function (
      req: Request<ChainIdPathParams & { address: Address }> & ReqData,
      res: Response,
      next: NextFunction,
    ) {
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
    function (req: Request, res: Response, next: NextFunction) {
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
    function (req: Request, res: Response, next: NextFunction) {
      // @ts-expect-error: req.data.chainId is set in parseChainId
      const { chainId } = req.data

      getTotalStaked(chainId)
        .then(function (staked) {
          sendJsonResponse(res, 200, { staked })
        })
        .catch(next)
    },
  )

  app.get(
    '/:chainIdStr(\\d+)/claim/:address(0x[0-9a-fA-F]{40})/:claimGroup(\\d+)',
    parseChainId,
    validateChainIsHemi,
    asyncHandler(getClaimTransactionHandler),
  )

  app.get(
    '/:chainIdStr(\\d+)/locks/:address(0x[0-9a-fA-F]{40})',
    parseChainId,
    validateChainIsHemi,
    asyncHandler(getLockedPositionsHandler),
  )

  app.use(function (req: Request, res: Response) {
    sendJsonResponse(res, 404, { error: 'Not Found' })
  })

  app.use(function (
    err: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction,
  ) {
    if (config.get<boolean>('debug')) {
      // eslint-disable-next-line no-console
      console.log(err)
    }
    sendJsonResponse(res, 500, { error: 'Internal Server Error' })
  })

  return app
}
