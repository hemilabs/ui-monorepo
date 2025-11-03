import { useQuery } from '@tanstack/react-query'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { EvmToken } from 'types/token'
import { calculateRewards } from 've-hemi-rewards/actions'
import type { Address } from 'viem'

import { RewardTokenConfig } from './useRewardTokens'

export const getCalculateRewardsQueryKey = ({
  chainId,
  rewardToken,
  tokenId,
}: {
  chainId: number
  rewardToken: string
  tokenId: bigint
}) => ['calculateRewards', tokenId.toString(), rewardToken, chainId]

export const useCalculateRewards = function ({
  enabled = true,
  rewardToken,
  token,
  tokenId,
}: {
  enabled?: boolean
  rewardToken: string
  token: EvmToken | RewardTokenConfig
  tokenId: bigint
}) {
  const { hemiWalletClient } = useHemiWalletClient()

  const queryKey = getCalculateRewardsQueryKey({
    chainId: token.chainId,
    rewardToken,
    tokenId,
  })

  return useQuery({
    enabled:
      enabled && !!hemiWalletClient && !!rewardToken && tokenId > BigInt(0),
    queryFn: () =>
      calculateRewards(hemiWalletClient!, tokenId, rewardToken as Address),
    queryKey,
    refetchInterval: 24000, // 24 seconds
  })
}
