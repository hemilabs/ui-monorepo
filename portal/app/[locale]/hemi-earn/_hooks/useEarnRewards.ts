'use client'

import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { isValidUrl } from 'utils/url'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'

const apiUrl = process.env.NEXT_PUBLIC_VETRO_API_URL

type RewardToken = {
  address: Address
  symbol: string
}

type EarnReward = {
  token: RewardToken
}

type RewardsResponse = Record<Address, EarnReward[]>

const emptyRewards: EarnReward[] = []

export const useEarnRewards = function (stakingVaultAddress: Address) {
  const { address } = useAccount()

  return useQuery({
    enabled:
      apiUrl !== undefined && isValidUrl(apiUrl) && address !== undefined,
    queryFn: () =>
      fetch(
        `${apiUrl}/variable-stake/rewards/${address}`,
      ) as Promise<RewardsResponse>,
    queryKey: ['hemi-earn', 'rewards', address],
    refetchInterval: 5 * 60 * 1000, // refetch every 5 min
    retry: 2,
    select: data => data[stakingVaultAddress] ?? emptyRewards,
  })
}
