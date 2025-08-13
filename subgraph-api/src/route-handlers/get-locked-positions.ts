import { Request, Response } from 'express'
import { type Address } from 'viem'

import { getLockedPositions } from '../subgraph.ts'
import { sendJsonResponse } from '../utils.ts'

type PathParameters = {
  address: Address
}

type Data = {
  chainId: number
}

export async function getLockedPositionsHandler(
  req: Request<PathParameters> & { data: Data },
  res: Response,
) {
  const { chainId } = req.data
  const { address } = req.params

  const positions = await getLockedPositions({
    address,
    chainId,
  })

  sendJsonResponse(res, 200, { positions })
}
