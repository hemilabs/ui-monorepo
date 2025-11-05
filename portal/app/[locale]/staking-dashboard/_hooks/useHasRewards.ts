import { useQueryClient } from '@tanstack/react-query'
import { useHemiToken } from 'hooks/useHemiToken'

import { getCalculateRewardsQueryKey } from './useCalculateRewards'
import { useRewardTokens } from './useRewardTokens'

export function useHasRewards(tokenId: string) {
  const queryClient = useQueryClient()
  const token = useHemiToken()
  const { isLoading, tokens: rewardTokens } = useRewardTokens()

  const totalRewards = rewardTokens.reduce(function (total, { address }) {
    const queryKey = getCalculateRewardsQueryKey({
      chainId: token.chainId,
      rewardToken: address,
      tokenId: BigInt(tokenId),
    })

    const data = queryClient.getQueryData<bigint>(queryKey)

    return total + (data ?? BigInt(0))
  }, BigInt(0))

  return {
    hasRewards: totalRewards > BigInt(0),
    isLoading,
    totalRewards,
  }
}
