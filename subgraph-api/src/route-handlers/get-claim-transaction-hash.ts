/* eslint-disable promise/no-callback-in-promise */
import { Request, Response } from 'express'
import { type Address } from 'viem'

import { getMerkleClaim } from '../subgraph.ts'
import { sendJsonResponse } from '../utils.ts'

type PathParameters = {
  address: Address
  claimGroup: string
}

type Data = {
  chainId: number
}

export async function getClaimTransactionHandler(
  req: Request<PathParameters> & { data: Data },
  res: Response,
) {
  const { chainId } = req.data
  const address = req.params.address as Address
  const claimGroup = parseInt(req.params.claimGroup)

  const claim = await getMerkleClaim({
    account: address,
    chainId,
    claimGroup,
  })

  if (claim) {
    sendJsonResponse(res, 200, claim)
  } else {
    sendJsonResponse(res, 404, { error: 'Not found' })
  }
}
