import { useQueries } from '@tanstack/react-query'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useHemiToken } from 'hooks/useHemiToken'

import { getCalculateRewardsQueryOptions } from './useCalculateRewards'
import { useRewardTokens } from './useRewardTokens'

export function useHasRewards(tokenId: bigint) {
  const token = useHemiToken()
  const { hemiWalletClient } = useHemiWalletClient()
  const { isLoading: isLoadingRewardTokens, tokens: rewardTokens } =
    useRewardTokens()

  return useQueries({
    combine(results) {
      const totalRewards = results.reduce(
        (total, { data }) => total + (data ?? BigInt(0)),
        BigInt(0),
      )

      return {
        hasRewards: totalRewards > BigInt(0),
        isLoading:
          isLoadingRewardTokens || results.some(result => result.isLoading),
        totalRewards,
      }
    },
    queries: rewardTokens.map(({ address }) =>
      getCalculateRewardsQueryOptions({
        chainId: token.chainId,
        hemiWalletClient,
        rewardToken: address,
        tokenId,
      }),
    ),
  })
}
