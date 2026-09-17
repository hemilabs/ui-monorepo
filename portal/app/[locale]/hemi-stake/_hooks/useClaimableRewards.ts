import { useMemo } from 'react'
import { isDataUnavailable } from 'utils/queryStatus'

import {
  getClaimTransactions,
  mergeClaimableRewards,
} from '../_utils/claimableRewards'

import { useEpochClaimableRewards } from './useEpochClaimableRewards'

type ClaimWindow = NonNullable<
  ReturnType<typeof useEpochClaimableRewards>['data']
>

const toSourceClaim = (windows: ClaimWindow) => ({
  rewards: mergeClaimableRewards(windows.map(({ rewards }) => rewards)),
  transactions: getClaimTransactions(windows),
})

/**
 * Everything one position can claim right now, and the transactions that would claim it.
 */
export const useClaimableRewards = function (tokenId: bigint) {
  const { data, fetchStatus, isError, isPending, status } =
    useEpochClaimableRewards(tokenId)

  const isUnavailable = isDataUnavailable({ fetchStatus, status })

  return useMemo(
    function () {
      const sources = [toSourceClaim(data ?? [])]

      return {
        isError,
        isPending: isPending && !isUnavailable,
        rewards: mergeClaimableRewards(sources.map(source => source.rewards)),
        transactions: sources.flatMap(source => source.transactions),
      }
    },
    [data, isError, isPending, isUnavailable],
  )
}
