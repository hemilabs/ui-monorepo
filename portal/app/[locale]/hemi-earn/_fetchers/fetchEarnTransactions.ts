import fetchPlusPlus from 'fetch-plus-plus'
import { hemi } from 'hemi-viem'
import { type Address } from 'viem'

import { type EarnTransaction } from '../types'

export const earnTransactionsKeyPrefix = ['hemi-earn', 'transactions'] as const

const getEarnRequestsUrl = (account: Address) =>
  `${process.env.NEXT_PUBLIC_PORTAL_API_URL}/subgraphs/${hemi.id}/earn-requests/${account}`

export const fetchEarnTransactions = async function ({
  account,
}: {
  account: Address
}): Promise<EarnTransaction[]> {
  const { requests } = (await fetchPlusPlus(getEarnRequestsUrl(account), {
    method: 'GET',
  })) as { requests: EarnTransaction[] }
  return requests
}
