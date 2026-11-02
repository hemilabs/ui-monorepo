import fetchPlusPlus from 'fetch-plus-plus'
import { type Address } from 'viem'

export const earnCostBasisKeyPrefix = ['hemi-earn', 'cost-basis'] as const

const toLowercaseKeys = (costBasis: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(costBasis).map(([share, value]) => [
      share.toLowerCase(),
      value,
    ]),
  )

export const fetchEarnCostBasis = async function ({
  account,
  apiUrl,
}: {
  account: Address
  apiUrl: string
}) {
  const { costBasis } = (await fetchPlusPlus(
    `${apiUrl}/hemi-earn/cost-basis/${account}`,
    { method: 'GET' },
  )) as { costBasis: Record<string, string> | undefined }
  if (costBasis === undefined) {
    throw new Error('Hemi Earn cost basis response is missing costBasis')
  }
  return toLowercaseKeys(costBasis)
}
