/* eslint-disable promise/no-callback-in-promise */

import { Request, Response, NextFunction } from 'express'

import { getWithdrawalProofAndClaim } from '../subgraph.ts'
import { sendJsonResponse } from '../utils.ts'

type PathParameters = {
  chainIdStr: string
  hash: string
}

type Data = {
  chainId: number
}

export const getWithdrawalProofAndClaimHandler = function (
  req: Request<PathParameters> & { data?: Data },
  res: Response,
  next: NextFunction,
) {
  const { hash } = req.params
  const { chainId } = req.data
  getWithdrawalProofAndClaim({ chainId, hashedWithdrawal: hash })
    .then(function (withdrawal) {
      if (!withdrawal) {
        sendJsonResponse(res, 404, { error: 'Withdrawal not found' })
        return
      }
      sendJsonResponse(res, 200, withdrawal)
    })
    .catch(next)
}
