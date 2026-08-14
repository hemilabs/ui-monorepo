import { useQueries } from '@tanstack/react-query'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useHemiToken } from 'hooks/useHemiToken'

import { getCalculateRewardsQueryOptions } from './useCalculateRewards'
import { useRewardTokens } from './useRewardTokens'

export function useHasRewards(tokenId: bigint) {
  const token = useHemiToken()
  const { hemiWalletClient } = useHemiWalletClient()
  const { tokens: rewardTokens } = useRewardTokens()

  return useQueries({
    combine: results => ({
      hasRewards: results.some(({ data }) => (data ?? BigInt(0)) > BigInt(0)),
    }),
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
