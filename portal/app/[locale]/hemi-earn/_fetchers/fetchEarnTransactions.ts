import fetchPlusPlus from 'fetch-plus-plus'
import { type Address } from 'viem'

import { type EarnTransaction } from '../types'

export const earnTransactionsKeyPrefix = ['hemi-earn', 'transactions'] as const

export const fetchEarnTransactions = async function ({
  account,
  apiUrl,
}: {
  account: Address
  apiUrl: string
}): Promise<EarnTransaction[]> {
  const { requests } = (await fetchPlusPlus(
    `${apiUrl}/hemi-earn/requests/${account}`,
    { cache: 'no-store', method: 'GET' },
  )) as { requests: EarnTransaction[] | undefined }
  if (requests === undefined) {
    throw new Error('Hemi Earn requests response is missing requests')
  }
  return requests
}
