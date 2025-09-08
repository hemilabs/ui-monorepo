import type { Request, Response } from 'express'

import { getBtcDeposit } from '../subgraph.ts'
import { sendJsonResponse } from '../utils.ts'

type PathParameters = {
  hash: string
}

type Data = {
  chainId: number
}

export const getBtcDepositOnHemi = async function (
  req: Request<PathParameters> & { data: Data },
  res: Response,
) {
  const { chainId } = req.data
  const { hash } = req.params

  const deposit = await getBtcDeposit({
    chainId,
    depositTxId: hash,
  })

  if (deposit === null) {
    sendJsonResponse(res, 404, { error: 'BTC deposit not found' })
    return
  }

  sendJsonResponse(res, 200, deposit)
}
