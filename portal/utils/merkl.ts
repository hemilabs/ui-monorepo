import { type EvmToken } from 'types/token'
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
  recipient: Address
  root: Hash
  token: MerklToken
}

export type MerklRewards = MerklReward[]

type MerklUserRewardsResponse = {
  rewards: MerklRewards
}[]

export type MerklCampaign = {
  apr: number
  campaignId: Hex
  endTimestamp: number
  id: string
  rewardToken: Pick<EvmToken, 'address' | 'chainId' | 'symbol'>
  status: string
}

export type MerklOpportunityResponse = {
  apr: number
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

/**
 * Fetches user rewards from the Merkl API for a specific address and chain.
 *
 * For more information about integrating user rewards, see the Merkl documentation:
 * https://docs.merkl.xyz/integrate-merkl/app#integrating-user-rewards
 *
 * @param params - Configuration object
 * @param params.address - The user's wallet address to fetch rewards for
 * @param params.chainId - The chain ID to fetch rewards from
 * @returns Promise resolving to an array of user rewards response objects
 */
export const getUserRewards = async function ({
  address,
  chainId,
}: {
  address: Address
  chainId: Chain['id']
}) {
  const chainIdStr = chainId.toString()
  return fetchMerkl<MerklUserRewardsResponse>(`/users/${address}/rewards`, {
    query: {
      chainId: chainIdStr,
      claimableOnly: 'true',
      // using reloadChainId to avoid Merkl cache. After all, we're caching on react-query
      // so we don't really need this extra layer of caching. Using it would break the
      // revalidation after claiming the rewards
      reloadChainId: chainIdStr,
    },
  })
}

export const getOpportunityCampaigns = async ({
  opportunityId,
}: {
  opportunityId: string
}) =>
  fetchMerkl<MerklOpportunityResponse>(
    `/opportunities/${opportunityId}/campaigns`,
  )
