import type { Request, Response } from 'express'
import { type Address } from 'viem'

import type { ChainIdPathParams } from '../../types.ts'
import { getEarnRequests } from '../subgraph.ts'

export async function getEarnRequestsHandler(
  req: Request<ChainIdPathParams & { address: Address }>,
  res: Response,
) {
  const { chainId } = req.data
  const { address } = req.params

  const requests = await getEarnRequests({
    address,
    // @ts-expect-error: chainId is validated at this point by validateChainIsHemiMainnet
    chainId,
  })

  res.status(200).json({ requests })
}
