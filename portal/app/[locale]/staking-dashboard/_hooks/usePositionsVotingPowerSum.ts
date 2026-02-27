import { useQueries } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useMemo } from 'react'
import { StakingPositionStatus } from 'types/stakingDashboard'
import { getPositionVotingPower } from 've-hemi-actions/actions'
import { useAccount } from 'wagmi'

import { getPositionVotingPowerQueryKey } from './usePositionVotingPower'
import { useStakingPositions } from './useStakingPositions'

export const usePositionsVotingPowerSum = function () {
  const { hemiWalletClient } = useHemiWalletClient()
  const { address } = useAccount()
  const chainId = useHemi().id
  const { data: positions } = useStakingPositions()

  const tokenIds = useMemo(
    () =>
      positions
        ?.filter(p => p.status === StakingPositionStatus.ACTIVE)
        .map(p => p.tokenId) ?? [],
    [positions],
  )

  const queries = useQueries({
    queries: tokenIds.map(tokenId => ({
      enabled: !!address && !!hemiWalletClient && tokenId > BigInt(0),
      queryFn: () =>
        getPositionVotingPower({
          client: hemiWalletClient!,
          ownerAddress: address!,
          tokenId,
        }),
      queryKey: getPositionVotingPowerQueryKey({
        chainId,
        tokenId,
      }),
      refetchInterval: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    })),
  })

  const sum = useMemo(
    () =>
      tokenIds.length === 0
        ? BigInt(0)
        : queries.every(q => q.isSuccess && q.data !== undefined)
          ? queries.reduce((acc, q) => acc + (q.data ?? BigInt(0)), BigInt(0))
          : undefined,
    [queries, tokenIds.length],
  )

  const isLoading = tokenIds.length > 0 && queries.some(q => q.isLoading)
  const isError = queries.some(q => q.isError)

  return {
    data: sum,
    isError,
    isLoading,
  }
}
