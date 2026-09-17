import { type FetchStatus, type QueryStatus } from '@tanstack/react-query'
import type { ClaimRewardTotal } from 'types/stakingDashboard'
import { isDataUnavailable } from 'utils/queryStatus'

type ClaimableRow = {
  claimable: bigint
  decimals: number
  symbol: string
  token: string
}

export type ClaimableResult = {
  data?: readonly ClaimableRow[]
  fetchStatus: FetchStatus
  status: QueryStatus
}

/**
 * Adds up what several positions can claim, per reward asset.
 *
 * A position whose read has not landed is not counted as zero - the total reports itself
 * as loading instead. A claim-all offered against a partial sum would quietly leave money
 * behind, and nothing on screen would say so.
 *
 * States are kept apart in the usual order: data, then unavailable, then loading.
 */
export const combineClaimable = function ({
  results,
  systemStateStatus,
  tokenIds,
}: {
  results: readonly ClaimableResult[]
  // The epoch grid these reads are bounded by. Until it resolves they sit disabled -
  // pending and idle - which is an ordinary first load, not a failure.
  systemStateStatus: QueryStatus
  tokenIds: readonly bigint[]
}) {
  const isUnavailable =
    systemStateStatus === 'error' ||
    (systemStateStatus === 'success' && results.some(isDataUnavailable))
  const isPending =
    !isUnavailable && results.some(result => result.data === undefined)

  const byToken = new Map<string, ClaimRewardTotal>()
  results.forEach(result =>
    result.data?.forEach(function ({ claimable, decimals, symbol, token }) {
      const running = byToken.get(token)
      byToken.set(token, {
        claimable: (running?.claimable ?? BigInt(0)) + claimable,
        decimals,
        symbol,
        token,
      })
    }),
  )

  return {
    // Only positions with something owed: claiming an empty one still costs a plan, a
    // simulation and a wallet prompt to transfer nothing.
    claimableTokenIds: results.flatMap((result, index) =>
      result.data?.some(row => row.claimable > BigInt(0))
        ? [tokenIds[index]]
        : [],
    ),
    isPending,
    isUnavailable,
    totals: [...byToken.values()].filter(total => total.claimable > BigInt(0)),
  }
}
