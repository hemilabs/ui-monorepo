import { useQueries } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { useCallback, useMemo } from 'react'
import type { StakingPosition } from 'types/stakingDashboard'
import {
  getEpochRewardsLensAddress,
  getRewardsGeneration,
} from 'utils/veHemiEpochRewards'
import { useAccount } from 'wagmi'

import { combineClaimable, type ClaimableResult } from '../_utils/claimTotals'

import { getEpochClaimableByTokenQueryOptions } from './useEpochClaimableByToken'
import { useEpochSystemState } from './useEpochSystemState'

// Everything the wallet can claim, across every position it is listed for. Uses the same
// per-position query the rows read, so the total and the rows agree by construction.
export const useAllPositionsClaimable = function (
  positions: StakingPosition[] | undefined,
) {
  const { address } = useAccount()
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const lensAddress = getEpochRewardsLensAddress(chainId)
  const { data: systemState, status: systemStateStatus } = useEpochSystemState()
  const isEpochGeneration = getRewardsGeneration(chainId) === 'epoch'

  // Memoised so `combine` can depend on it - otherwise the combined result is a new
  // object every render and every consumer re-renders on any state change.
  const tokenIds = useMemo(
    () => positions?.map(position => position.tokenId) ?? [],
    [positions],
  )

  const combine = useCallback(
    (results: ClaimableResult[]) =>
      combineClaimable({ results, systemStateStatus, tokenIds }),
    [systemStateStatus, tokenIds],
  )

  return useQueries({
    combine,
    queries: isEpochGeneration
      ? tokenIds.map(tokenId =>
          getEpochClaimableByTokenQueryOptions({
            chainId,
            hemiClient,
            holder: address,
            lensAddress,
            systemState,
            tokenId,
          }),
        )
      : [],
  })
}
