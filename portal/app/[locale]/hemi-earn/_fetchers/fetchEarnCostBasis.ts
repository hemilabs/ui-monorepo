import fetchPlusPlus from 'fetch-plus-plus'
import { hemi } from 'hemi-viem'
import { type Address } from 'viem'

export const earnCostBasisKeyPrefix = ['hemi-earn', 'cost-basis'] as const

const getEarnCostBasisUrl = (account: Address) =>
  `${import.meta.env.VITE_PORTAL_API_URL}/subgraphs/${hemi.id}/earn-cost-basis/${account}`

export const fetchEarnCostBasis = async function ({
  account,
}: {
  account: Address
}) {
  const { costBasis } = (await fetchPlusPlus(getEarnCostBasisUrl(account), {
    method: 'GET',
  })) as { costBasis: Record<string, string> }
  return costBasis
}
