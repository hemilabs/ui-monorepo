import type { Request, Response } from 'express'
import { type Address } from 'viem'

import { getMerkleClaim } from '../subgraph.ts'

export async function getClaimTransactionHandler(req: Request, res: Response) {
  const { chainId } = req.data
  const address = req.params.address as Address
  const claimGroup = parseInt(req.params.claimGroup as string, 10)

  const claim = await getMerkleClaim({
    account: address,
    // @ts-expect-error: chainId is set by parseChainId and validated by validateChainIsHemi
    chainId,
    claimGroup,
  })

  if (claim) {
    res.status(200).json(claim)
  } else {
    res.status(404).json({ error: 'Not found' })
  }
}
