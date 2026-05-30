import express from 'express'
import type { NextFunction, Request, Response } from 'express'
import type { Address } from 'viem'
import { hemi, hemiSepolia, mainnet, sepolia } from 'viem/chains'

import { toJsonMiddleware } from '../to-middleware.ts'
import type { ChainIdPathParams, ReqData } from '../types.ts'

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
import { isInteger } from './utils.ts'

function parseChainId(
  req: Request<ChainIdPathParams> & ReqData,
  res: Response,
  next: NextFunction,
) {
  const { chainIdStr } = req.params
  if (!isInteger(chainIdStr)) {
    next('route')
    return
  }
  req.data = req.data || {}
  req.data.chainId = Number.parseInt(chainIdStr)
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

// Path-param validators replacing Express 4 inline regex. On failure they call
// next('route') so the request falls through to the app-level 404 handler,
// preserving the old "regex didn't match" behavior.
const addressRegExp = /^0x[0-9a-fA-F]{40}$/

function validateAddress(req: Request, res: Response, next: NextFunction) {
  if (addressRegExp.test(req.params.address as string)) {
    next()
  } else {
    next('route')
  }
}

function validateOperation(req: Request, res: Response, next: NextFunction) {
  const { operation } = req.params
  if (operation === 'deposits' || operation === 'withdrawals') {
    next()
  } else {
    next('route')
  }
}

function validateWithdrawalType(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { type } = req.params
  if (type === 'btc' || type === 'evm') {
    next()
  } else {
    next('route')
  }
}

function validateClaimGroup(req: Request, res: Response, next: NextFunction) {
  if (isInteger(req.params.claimGroup as string)) {
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
    res.status(400).json({ error: 'fromBlock must be a number' })
    return
  }
  req.data.fromBlock = Number.parseInt(fromBlock)

  if (limit) {
    if (!isInteger(limit)) {
      res.status(400).json({ error: 'limit must be a number' })
      return
    }
    req.data.limit = Number.parseInt(limit)
  }

  if (skip) {
    if (!isInteger(skip)) {
      res.status(400).json({ error: 'skip must be a number' })
      return
    }
    req.data.skip = Number.parseInt(skip)
  }

  next()
}

// Adapter for toJsonMiddleware, which passes path params positionally as
// strings: coerce chainId to a number and wrap the result in its envelope.
const getStaked = (chainIdStr: string) =>
  getTotalStaked(Number(chainIdStr)).then(staked => ({ staked }))

export function createSubgraphsRouter() {
  // eslint-disable-next-line new-cap -- express.Router is a factory, not a constructor
  const router = express.Router()

  router.get(
    '/:chainIdStr/:operation/meta',
    parseChainId,
    validateOperation,
    function (req: Request & ReqData, res: Response, next: NextFunction) {
      const { operation } = req.params
      if (operation === 'deposits') {
        validateChainIsEthereum(req, res, next)
      } else {
        validateChainIsHemi(req, res, next)
      }
    },
    async function (req: Request, res: Response) {
      const { chainId } = req.data

      // @ts-expect-error: chainId is set by parseChainId and validated upstream
      const number = await getLastIndexedBlock(chainId)
      res.status(200).json({ number })
    },
  )

  router.get(
    '/:chainIdStr/deposits/:hash/btc',
    parseChainId,
    validateChainIsHemi,
    getBtcDepositOnHemi,
  )

  router.get(
    '/:chainIdStr/deposits/:address',
    parseChainId,
    validateAddress,
    validateChainIsEthereum,
    parseQueryParams,
    async function (
      req: Request<ChainIdPathParams & { address: Address }> & ReqData,
      res: Response,
    ) {
      const { address } = req.params

      // @ts-expect-error: req.data is populated by parseChainId and parseQueryParams
      const deposits = await getEvmDeposits({ address, ...req.data })
      res.status(200).json({ deposits })
    },
  )

  router.get(
    '/:chainIdStr/hashedWithdrawals/:hash',
    parseChainId,
    validateChainIsEthereum,
    getWithdrawalProofAndClaimHandler,
  )

  router.get(
    '/:chainIdStr/withdrawals/:address/:type',
    parseChainId,
    validateAddress,
    validateWithdrawalType,
    validateChainIsHemi,
    parseQueryParams,
    async function (req: Request, res: Response) {
      const { address, type } = req.params

      const getWithdrawals =
        type === 'evm' ? getEvmWithdrawals : getBtcWithdrawals

      // @ts-expect-error: req.data is populated by parseChainId and parseQueryParams
      const withdrawals = await getWithdrawals({ address, ...req.data })
      res.status(200).json({ withdrawals })
    },
  )

  router.get(
    '/:chainIdStr/staked',
    parseChainId,
    validateChainIsHemi,
    // Cached: the total staked is a per-chain aggregate that tolerates mild
    // staleness. Keyed by chainId (the only path param).
    toJsonMiddleware(getStaked, {
      maxAge: 30 * 1000,
      resolver: chainIdStr => chainIdStr,
    }),
  )

  router.get(
    '/:chainIdStr/claim/:address/:claimGroup',
    parseChainId,
    validateAddress,
    validateClaimGroup,
    validateChainIsHemi,
    getClaimTransactionHandler,
  )

  router.get(
    '/:chainIdStr/locks/:address',
    parseChainId,
    validateAddress,
    validateChainIsHemi,
    getLockedPositionsHandler,
  )

  return router
}
