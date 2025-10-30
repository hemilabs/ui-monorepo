import { useQueryClient } from '@tanstack/react-query'
import { useHemiToken } from 'hooks/useHemiToken'
import { useRewardTokens } from 'hooks/useRewardTokens'

import { getCalculateRewardsQueryKey } from './useCalculateRewards'

export function useHasRewards(tokenId: string) {
  const queryClient = useQueryClient()
  const token = useHemiToken()
  const rewardTokens = useRewardTokens()

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
    totalRewards,
  }
}
