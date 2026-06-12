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
// Polling: every 10s while at least one row is non-terminal (cross-chain
// in flight, auto-claim pending, cooldown maturing) or a local entry hasn't
// shown up in the subgraph yet. Stops on FINALIZED / CANCELLED / RECOVERED
// / FAILED — FAILED is portal-terminal because the user needs to retry, not
// wait for the eventual Router cancel.
export const useEarnTransactionsQuery = function () {
  const [networkType] = useNetworkType()
  const { address } = useAccount()
  const { localOperations } = useLocalEarnOperations()

  const inFlightLocalsExist = localOperations.some(
    op => op.initiateTxHash !== undefined && !op.settled,
  )

  return useQuery({
    enabled: !!address,
    queryFn: () => fetchEarnTransactions({ account: address!, networkType }),
    queryKey: [...earnTransactionsKeyPrefix, networkType, address],
    refetchInterval(query) {
      const subgraphData = (query.state.data ?? []) as EarnTransaction[]
      const hasSubgraphInFlight = subgraphData.some(
        t =>
          t.status !== 'FINALIZED' &&
          t.status !== 'CANCELLED' &&
          t.status !== 'RECOVERED' &&
          t.status !== 'FAILED',
      )
      return hasSubgraphInFlight || inFlightLocalsExist ? 10_000 : false
    },
  })
}
