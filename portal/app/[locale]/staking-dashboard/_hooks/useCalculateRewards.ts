import { useQuery } from '@tanstack/react-query'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useMemo } from 'react'
import { StakingDashboardToken } from 'types/stakingDashboard'
import { calculateRewards } from 've-hemi-rewards/actions'
import type { Address } from 'viem'

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

  const queryKey = useMemo(
    () =>
      [
        'calculateRewards',
        tokenId.toString(), // to avoid issues with bigint in query keys
        rewardToken,
        token.chainId,
      ] as const,
    [tokenId, rewardToken, token.chainId],
  )

  return useQuery({
    enabled:
      enabled && !!hemiWalletClient && !!rewardToken && tokenId > BigInt(0),
    queryFn: () => calculateRewards(hemiWalletClient!, tokenId, rewardToken),
    queryKey,
    refetchInterval: 24000, // 24 seconds
  })
}
