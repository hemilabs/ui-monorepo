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
} from './subgraph'

const { originList } = config

function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

export function createServer() {
  const app = express()

  app.use(cors({ origin: originList }))

  app.get(
    '/:chainIdStr(\\d+)/:operation(deposits|withdrawals)/meta',
    function (req, res, next) {
      const { chainIdStr, operation } = req.params
      const chainId = parseInt(chainIdStr)

      if (
        (operation === 'deposits' &&
          // @ts-expect-error: chainIds are numbers
          ![mainnet.id, sepolia.id].includes(chainId)) ||
        (operation === 'withdrawals' &&
          // @ts-expect-error: chainIds are numbers
          ![hemi.id, hemiSepolia.id].includes(chainId))
      ) {
        next()
        return
      }

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
    function (req, res, next) {
      const { chainIdStr, address } = req.params
      const chainId = parseInt(chainIdStr)
      const { fromBlock, limit, orderBy, orderDirection, skip } = req.query

      // @ts-expect-error: chainIds are numbers
      if (![mainnet.id, sepolia.id].includes(chainId)) {
        next()
        return
      }

      const params = {
        address,
        chainId,
        fromBlock,
        limit,
        orderBy,
        orderDirection,
        skip,
      }
      // @ts-expect-error: address is always`0x${string}`
      getEvmDeposits(params)
        .then(function (deposits) {
          sendJsonResponse(res, 200, { deposits })
        })
        // eslint-disable-next-line promise/no-callback-in-promise
        .catch(next)
    },
  )

  app.get(
    '/:chainIdStr(\\d+)/withdrawals/:address(0x[0-9a-fA-F]{40})/:type(btc|evm)',
    function (req, res, next) {
      const { chainIdStr, address, type } = req.params
      const chainId = parseInt(chainIdStr)
      const { fromBlock, limit, orderBy, orderDirection, skip } = req.query

      // @ts-expect-error: chainIds are numbers
      if (![hemi.id, hemiSepolia.id].includes(chainId)) {
        next()
        return
      }

      let getWithdrawals
      if (type === 'evm') {
        getWithdrawals = getEvmWithdrawals
      } else {
        getWithdrawals = getBtcWithdrawals
      }

      const params = {
        address,
        chainId,
        fromBlock,
        limit,
        orderBy,
        orderDirection,
        skip,
      }
      getWithdrawals(params)
        .then(function (withdrawals) {
          sendJsonResponse(res, 200, { withdrawals })
        })
        // eslint-disable-next-line promise/no-callback-in-promise
        .catch(next)
    },
  )

  app.get('/:chainIdStr(\\d+)/staked', function (req, res, next) {
    const { chainIdStr } = req.params
    const chainId = parseInt(chainIdStr)

    // @ts-expect-error: chainIds are numbers
    if (![hemi.id, hemiSepolia.id].includes(chainId)) {
      next()
      return
    }

    getTotalStaked(chainId)
      .then(function (staked) {
        sendJsonResponse(res, 200, { staked })
      })
      // eslint-disable-next-line promise/no-callback-in-promise
      .catch(next)
  })

  app.use(function (req, res) {
    sendJsonResponse(res, 404, { error: 'Not Found' })
  })

  // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
  app.use(function (err, req, res, next) {
    sendJsonResponse(res, 500, {
      error: 'Internal Server Error',
    })
  })

  return app
}
