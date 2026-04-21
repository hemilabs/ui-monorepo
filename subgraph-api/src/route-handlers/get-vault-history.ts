import type { Request, Response } from 'express'
import { type Address } from 'viem'

import { getVaultHistory } from '../subgraph.ts'
import { isInteger, sendJsonResponse } from '../utils.ts'

type PathParameters = {
  address: Address
}

type Data = {
  chainId: number
}

type QueryParams = {
  since?: string
}

export async function getVaultHistoryHandler(
  req: Request<PathParameters, object, object, QueryParams> & { data: Data },
  res: Response,
) {
  const { chainId } = req.data
  const { address } = req.params
  const { since } = req.query

  if (since !== undefined && !isInteger(since)) {
    sendJsonResponse(res, 400, { error: 'since must be a number' })
    return
  }

  const sinceTimestamp = since ? Number.parseInt(since) : 0

  const history = await getVaultHistory({
    address,
    chainId,
    since: sinceTimestamp,
  })

  sendJsonResponse(res, 200, { history })
}
