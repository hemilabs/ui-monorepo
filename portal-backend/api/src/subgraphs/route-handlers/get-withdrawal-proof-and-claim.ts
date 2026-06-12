import type { Request, Response } from 'express'

import { getWithdrawalProofAndClaim } from '../subgraph.ts'

export const getWithdrawalProofAndClaimHandler = async function (
  req: Request,
  res: Response,
) {
  const hash = req.params.hash as string
  const { chainId } = req.data
  const withdrawal = await getWithdrawalProofAndClaim({
    // @ts-expect-error: chainId is set by parseChainId and validated by validateChainIsEthereum
    chainId,
    hashedWithdrawal: hash,
  })
  if (!withdrawal) {
    res.status(404).json({ error: 'Withdrawal not found' })
    return
  }
  res.status(200).json(withdrawal)
}
