import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useMemo } from 'react'
import {
  type StakingPosition,
  StakingPositionStatus,
} from 'types/stakingDashboard'
import { getPositionsVotingPowerSum } from 've-hemi-actions/actions'
import type { Address } from 'viem'
import { useAccount } from 'wagmi'

import { useStakingPositions } from './useStakingPositions'

const getPositionsVotingPowerSumQueryKey = ({
  chainId,
  ownerAddress,
  tokenIds,
}: {
  chainId: number
  ownerAddress: Address
  tokenIds: bigint[]
}) => [
  'positions-voting-power-sum',
  chainId,
  ownerAddress.toLowerCase(),
  tokenIds.map(String).sort().join(','),
]

/** Prefix for invalidation: matches all position sum queries for this user/chain. Requires ownerAddress so invalidation reliably matches cached keys. */
export const getPositionsVotingPowerSumQueryKeyPrefix = ({
  chainId,
  ownerAddress,
}: {
  chainId: number
  ownerAddress: Address
}) => ['positions-voting-power-sum', chainId, ownerAddress.toLowerCase()]

function computeSum(
  positions: StakingPosition[] | undefined,
  tokenIds: bigint[],
  batchSum: bigint | undefined,
): bigint | undefined {
  if (positions === undefined) return undefined
  if (tokenIds.length === 0) return BigInt(0)
  return batchSum
}

export const usePositionsVotingPowerSum = function () {
  const { hemiWalletClient } = useHemiWalletClient()
  const { address } = useAccount()
  const chainId = useHemi().id
  const {
    data: positions,
    isError: isPositionsError,
    isLoading: isPositionsLoading,
  } = useStakingPositions()

  const tokenIds = useMemo(
    () =>
      positions
        ?.filter(p => p.status === StakingPositionStatus.ACTIVE)
        .map(p => p.tokenId) ?? [],
    [positions],
  )

  const queryKey = useMemo(
    () =>
      getPositionsVotingPowerSumQueryKey({
        chainId,
        ownerAddress: address!,
        tokenIds,
      }),
    [chainId, address, tokenIds],
  )

  const batchQuery = useQuery({
    enabled:
      !!address &&
      !!hemiWalletClient &&
      positions !== undefined &&
      tokenIds.length > 0,
    queryFn: () =>
      getPositionsVotingPowerSum({
        client: hemiWalletClient!,
        ownerAddress: address!,
        tokenIds,
      }),
    queryKey,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  })

  const data = useMemo(
    () => computeSum(positions, tokenIds, batchQuery.data),
    [positions, tokenIds, batchQuery.data],
  )

  const isLoading =
    isPositionsLoading || (tokenIds.length > 0 && batchQuery.isLoading)
  const isError = isPositionsError || batchQuery.isError

  return {
    data,
    isError,
    isLoading,
  }
}
