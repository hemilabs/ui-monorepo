'use client'

import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { useAccount } from 'wagmi'

import {
  earnTransactionsKeyPrefix,
  fetchEarnTransactions,
} from '../_fetchers/fetchEarnTransactions'
import { type EarnTransaction } from '../types'

import { useLocalEarnOperations } from './useLocalEarnOperations'

// Raw subgraph query. Internal building block shared by `useEarnTransactions`
// (which merges with local entries for the table) and `useEarnDeliveryWatcher`
// (which runs the reconcile + invalidation side effects against the raw
// subgraph view). React Query dedupes the underlying fetch across both
// consumers — a single network call per interval drives every subscriber.
//
// Polling: every 10s while there's at least one row we're actively waiting
// on — either a subgraph entry stuck on PENDING / FULFILLED (cross-chain
// in flight, or auto-claim still pending) or a local entry whose
// initiateTxHash hasn't shown up in the subgraph yet (indexer lag). Stops
// once all rows are terminal (CLAIMED / CANCELLED / RECOVERED).
//
// TODO(withdraw): redeem will need to also poll on FULFILLED-without-claim
// (cooldown maturity) — the predicate below stays the same shape, the
// status check just gains another branch.
export const useEarnTransactionsQuery = function () {
  const [networkType] = useNetworkType()
  const { address } = useAccount()
  const { localOperations } = useLocalEarnOperations()

  const inFlightLocalsExist = localOperations.some(
    op => op.kind === 'DEPOSIT' && op.initiateTxHash !== undefined,
  )

  return useQuery({
    enabled: !!address,
    queryFn: () => fetchEarnTransactions({ account: address!, networkType }),
    queryKey: [...earnTransactionsKeyPrefix, networkType, address],
    refetchInterval(query) {
      const subgraphData = (query.state.data ?? []) as EarnTransaction[]
      const hasSubgraphInFlight = subgraphData.some(
        t =>
          t.kind === 'DEPOSIT' &&
          t.status !== 'CLAIMED' &&
          t.status !== 'CANCELLED' &&
          t.status !== 'RECOVERED',
      )
      return hasSubgraphInFlight || inFlightLocalsExist ? 10_000 : false
    },
  })
}
