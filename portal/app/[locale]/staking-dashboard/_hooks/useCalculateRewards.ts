import { useQuery } from '@tanstack/react-query'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { StakingDashboardToken } from 'types/stakingDashboard'
import { calculateRewards } from 've-hemi-rewards/actions'
import type { Address } from 'viem'

export const getCalculateRewardsQueryKey = ({
  chainId,
  rewardToken,
  tokenId,
}: {
  chainId: number
  rewardToken: Address
  tokenId: bigint
}) => ['calculateRewards', tokenId.toString(), rewardToken, chainId]

export const useCalculateRewards = function ({
  enabled = true,
  rewardToken,
  token,
  tokenId,
}: {
  enabled?: boolean
  rewardToken: Address
  token: StakingDashboardToken
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
    queryFn: () => calculateRewards(hemiWalletClient!, tokenId, rewardToken),
    queryKey,
    refetchInterval: 24000, // 24 seconds
  })
}
