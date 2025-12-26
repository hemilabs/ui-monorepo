import { type Hex, type Address, type Chain, type Hash } from 'viem'

import { queryStringObjectToString } from './url'

type MerklToken = {
  address: Address
  chainId: number
  decimals: number
  price: number
  symbol: string
}

type MerklBreakdown = {
  amount: string
  campaignId: string
  claimed: string
  distributionChainId: number
  pending: string
  reason: string
  root: Hash
  subCampaignId: string
}

type MerklReward = {
  amount: string
  breakdowns: MerklBreakdown[]
  claimed: string
  distributionChainId: number
  pending: string
  proofs: Hash[]
  recipient: string
  root: Hash
  token: MerklToken
}

export type MerklRewards = MerklReward[]

type MerklUserRewardsResponse = {
  rewards: MerklRewards
}[]

type MerklCampaign = {
  campaignId: Hex
  id: string
  status: string
}

type MerklOpportunityResponse = {
  campaigns: MerklCampaign[]
  chainId: Chain['id']
  id: string
  status: 'LIVE' | 'PAST'
}

const fetchMerkl = async function <TResponse>(
  endpoint: string,
  options?: {
    query?: Record<string, string>
  },
) {
  const url = `https://api.merkl.xyz/v4${endpoint}${
    options?.query ? queryStringObjectToString(options.query) : ''
  }`

  const response = await fetch(url)
  return response.json() as Promise<TResponse>
}

export const getUserRewards = async ({
  address,
  chainId,
}: {
  address: Address
  chainId: Chain['id']
}) =>
  fetchMerkl<MerklUserRewardsResponse>(`/users/${address}/rewards`, {
    query: { chainId: chainId.toString() },
  })

export const getOpportunityCampaigns = async ({
  opportunityId,
}: {
  opportunityId: string
}) =>
  fetchMerkl<MerklOpportunityResponse>(
    `/opportunities/${opportunityId}/campaigns`,
  )
