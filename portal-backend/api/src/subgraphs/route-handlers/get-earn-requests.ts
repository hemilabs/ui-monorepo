import type { Request, Response } from 'express'
import { type Address } from 'viem'

import type { ChainIdPathParams } from '../../types.ts'
import { getEarnRequests } from '../subgraph.ts'

export async function getEarnRequestsHandler(
  req: Request<ChainIdPathParams & { address: Address }>,
  res: Response,
) {
  const { address } = req.params

  const requests = await getEarnRequests({ address })

  res.status(200).json({ requests })
}
