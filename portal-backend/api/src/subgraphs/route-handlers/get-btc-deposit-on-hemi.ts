import type { Request, Response } from 'express'

import { getBtcDeposit } from '../subgraph.ts'

export const getBtcDepositOnHemi = async function (
  req: Request,
  res: Response,
) {
  const { chainId } = req.data
  const hash = req.params.hash as string

  const deposit = await getBtcDeposit({
    // @ts-expect-error: chainId is set by parseChainId and validated by validateChainIsHemi
    chainId,
    depositTxId: hash,
  })

  if (deposit === null) {
    res.status(404).json({ error: 'BTC deposit not found' })
    return
  }

  res.status(200).json(deposit)
}
