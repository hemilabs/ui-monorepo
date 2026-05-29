import type { Request, Response } from 'express'
import { type Address } from 'viem'

import { getLockedPositions } from '../subgraph.ts'

export async function getLockedPositionsHandler(req: Request, res: Response) {
  const { chainId } = req.data
  const address = req.params.address as Address

  const positions = await getLockedPositions({
    address,
    // @ts-expect-error: chainId is set by parseChainId and validated by validateChainIsHemi
    chainId,
  })

  res.status(200).json({ positions })
}
