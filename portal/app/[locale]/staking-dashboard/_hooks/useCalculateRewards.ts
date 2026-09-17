import { queryOptions, useQuery } from '@tanstack/react-query'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { EvmToken } from 'types/token'
import { getRewardsGeneration } from 'utils/veHemiEpochRewards'
import { calculateRewards } from 've-hemi-rewards/actions'
import type { Address } from 'viem'

import { useEpochClaimableByToken } from './useEpochClaimableByToken'

type HemiWalletClient = ReturnType<
  typeof useHemiWalletClient
>['hemiWalletClient']

export const getCalculateRewardsQueryKey = ({
  chainId,
  rewardToken,
  tokenId,
}: {
  chainId: number
  rewardToken: string
  tokenId: bigint
}) => ['calculateRewards', tokenId.toString(), rewardToken, chainId]

// Shared with `useHasRewards` so both observe the same query.
export const getCalculateRewardsQueryOptions = ({
  chainId,
  enabled = true,
  hemiWalletClient,
  rewardToken,
  tokenId,
}: {
  chainId: number
  enabled?: boolean
  hemiWalletClient: HemiWalletClient
  rewardToken: string
  tokenId: bigint
}) =>
  queryOptions({
    enabled:
      enabled && !!hemiWalletClient && !!rewardToken && tokenId > BigInt(0),
    queryFn: () =>
      calculateRewards(hemiWalletClient!, tokenId, rewardToken as Address),
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
  const { hemiWalletClient } = useHemiWalletClient()
  const isEpochGeneration = getRewardsGeneration(token.chainId) === 'epoch'

  // One Lens read covers every asset, so each amount is selected out of it.
  const epochClaimable = useEpochClaimableByToken(tokenId)

  const legacy = useQuery(
    getCalculateRewardsQueryOptions({
      chainId: token.chainId,
      enabled: enabled && !isEpochGeneration,
      hemiWalletClient,
      rewardToken,
      tokenId,
    }),
  )

  // Both `fetchStatus` and `status` travel: `isLoading` alone cannot tell a failed read
  // from a disabled one from a genuine zero, and all three must not render as "0".
  if (!isEpochGeneration) {
    return {
      data: legacy.data,
      // The original contract answers with a bare amount, so callers fall back to the
      // token's own decimals. Only the epoch generation reports them per row.
      decimals: undefined,
      fetchStatus: legacy.fetchStatus,
      isMissingRow: false,
      status: legacy.status,
      symbol: undefined,
    }
  }

  const row = epochClaimable.data?.find(
    entry => entry.token.toLowerCase() === rewardToken.toLowerCase(),
  )

  return {
    data: row?.claimable,
    // From the row, not looked up again: the registry mixes 18dp and 8dp assets.
    decimals: row?.decimals,
    fetchStatus: epochClaimable.fetchStatus,
    // The read succeeded and listed no row for this registered asset - neither a zero
    // nor a value still coming. Without saying so, callers see `data: undefined` on a
    // settled query and keep waiting.
    isMissingRow: epochClaimable.status === 'success' && row === undefined,
    status: epochClaimable.status,
    symbol: row?.symbol,
  }
}
