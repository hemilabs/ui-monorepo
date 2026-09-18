import { queryOptions, useQuery } from '@tanstack/react-query'
import { useHemiClient } from 'hooks/useHemiClient'
import { EvmToken } from 'types/token'
import { calculateRewards } from 've-hemi-rewards/actions'
import type { Address } from 'viem'

type HemiClient = ReturnType<typeof useHemiClient>

export const getCalculateRewardsQueryKey = ({
  chainId,
  rewardToken,
  tokenId,
}: {
  chainId: number
  rewardToken: string
  tokenId: bigint
}) => ['calculateRewards', tokenId.toString(), rewardToken, chainId]

// Shared by the cell that renders the amount and by `useHasRewards`, so both
// observe the same query instead of one of them reading what the other cached.
export const getCalculateRewardsQueryOptions = ({
  chainId,
  enabled = true,
  hemiClient,
  rewardToken,
  tokenId,
}: {
  chainId: number
  enabled?: boolean
  hemiClient: HemiClient
  rewardToken: string
  tokenId: bigint
}) =>
  queryOptions({
    enabled: enabled && !!hemiClient && !!rewardToken && tokenId > BigInt(0),
    queryFn: () =>
      calculateRewards(hemiClient, tokenId, rewardToken as Address),
    queryKey: getCalculateRewardsQueryKey({ chainId, rewardToken, tokenId }),
    refetchInterval: 24000, // 24 seconds
  })

export const useCalculateRewards = function ({
  enabled = true,
  rewardToken,
  token,
  tokenId,
}: {
  enabled?: boolean
  rewardToken: string
  token: EvmToken
  tokenId: bigint
}) {
  const hemiClient = useHemiClient()

  return useQuery(
    getCalculateRewardsQueryOptions({
      chainId: token.chainId,
      enabled,
      hemiClient,
      rewardToken,
      tokenId,
    }),
  )
}
