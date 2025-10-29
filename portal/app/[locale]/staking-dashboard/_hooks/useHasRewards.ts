import { useQueryClient } from '@tanstack/react-query'
import { useHemiToken } from 'hooks/useHemiToken'
import { useRewardTokens } from 'hooks/useRewardTokens'

export function useHasRewards(tokenId: string) {
  const queryClient = useQueryClient()
  const token = useHemiToken()
  const rewardTokens = useRewardTokens()

  const totalRewards = rewardTokens.reduce(function (total, { address }) {
    const queryKey = [
      'calculateRewards',
      tokenId,
      address,
      token.chainId,
    ] as const

    const data = queryClient.getQueryData<bigint>(queryKey)

    return total + (data ?? BigInt(0))
  }, BigInt(0))

  return {
    hasRewards: totalRewards > BigInt(0),
    totalRewards,
  }
}
