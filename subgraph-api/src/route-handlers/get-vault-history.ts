import type { Request, Response } from 'express'
import { type Address } from 'viem'

import { getVaultHistory } from '../subgraph.ts'
import { sendJsonResponse } from '../utils.ts'

type PathParameters = {
  address: Address
}

type Data = {
  chainId: number
}

const validPeriods = ['1w', '1m', '3m', '1y'] as const
type Period = (typeof validPeriods)[number]

/* eslint-disable sort-keys */
const periodSeconds: Record<Period, number> = {
  '1w': 7 * 86400,
  '1m': 30 * 86400,
  '3m': 90 * 86400,
  '1y': 365 * 86400,
}
/* eslint-enable sort-keys */

type QueryParams = {
  period?: string
}

export async function getVaultHistoryHandler(
  req: Request<PathParameters, object, object, QueryParams> & { data: Data },
  res: Response,
) {
  const { chainId } = req.data
  const { address } = req.params
  const { period } = req.query

  if (!period || !validPeriods.includes(period as Period)) {
    sendJsonResponse(res, 400, {
      error: `period is required and must be one of: ${validPeriods.join(
        ', ',
      )}`,
    })
    return
  }

  const now = Math.floor(Date.now() / 1000)
  const since = now - periodSeconds[period as Period]

  const history = await getVaultHistory({
    address,
    chainId,
    since,
  })

  sendJsonResponse(res, 200, { history })
}
