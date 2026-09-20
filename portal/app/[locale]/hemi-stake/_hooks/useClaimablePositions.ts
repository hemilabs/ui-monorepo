import { useQueries } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { useAccount } from 'wagmi'

import {
  getClaimTransactions,
  mergeClaimableRewards,
} from '../_utils/claimableRewards'

import { getEpochClaimableRewardsQueryOptions } from './useEpochClaimableRewards'
import { useEpochSystemState } from './useEpochSystemState'

/**
 * What each position can claim right now, and the transactions that would claim it.
 *
 * Reads the same queries as `useClaimableRewards`, so the rows and the claim agree.
 */
export const useClaimablePositions = function (tokenIds: bigint[]) {
  const { address } = useAccount()
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const { data: systemState } = useEpochSystemState()

  const results = useQueries({
    queries: tokenIds.map(tokenId =>
      getEpochClaimableRewardsQueryOptions({
        chainId,
        hemiClient,
        holder: address,
        systemState,
        tokenId,
      }),
    ),
  })

  const positions = tokenIds.map(function (tokenId, index) {
    const windows = results[index].data ?? []
    return {
      rewards: mergeClaimableRewards(windows.map(({ rewards }) => rewards)),
      tokenId,
      transactions: getClaimTransactions(windows),
    }
  })

  return {
    positions,
    rewards: mergeClaimableRewards(positions.map(({ rewards }) => rewards)),
  }
}
