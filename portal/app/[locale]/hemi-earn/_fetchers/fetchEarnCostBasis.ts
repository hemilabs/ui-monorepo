import fetchPlusPlus from 'fetch-plus-plus'
import { type Address } from 'viem'

export const earnCostBasisKeyPrefix = ['hemi-earn', 'cost-basis'] as const

export const fetchEarnCostBasis = async function ({
  account,
  apiUrl,
}: {
  account: Address
  apiUrl: string
}) {
  const { costBasis } = (await fetchPlusPlus(
    `${apiUrl}/hemi-earn/cost-basis/${account}`,
    { cache: 'no-store', method: 'GET' },
  )) as { costBasis: Record<string, string> | undefined }
  if (costBasis === undefined) {
    throw new Error('Hemi Earn cost basis response is missing costBasis')
  }
  return costBasis
}
