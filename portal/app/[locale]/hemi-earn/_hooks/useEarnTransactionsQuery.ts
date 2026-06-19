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
// in flight, auto-claim pending, cooldown maturing, or a deposit awaiting
// recovery) or a local entry hasn't shown up in the subgraph yet. Stops on
// FINALIZED / RECOVERED / FAILED and on a REDEEM CANCELLED (withdrawal
// canceled). A DEPOSIT CANCELLED keeps polling because it still walks to
// RECOVERED (auto, or via the user's recover) — mirroring how FULFILLED walks
// to FINALIZED. FAILED is portal-terminal: the user retries, not waits.
export const useEarnTransactionsQuery = function () {
  const [networkType] = useNetworkType()
  const { address } = useAccount()
  const { localOperations } = useLocalEarnOperations()

  const inFlightLocalsExist = localOperations.some(
    op => op.initiateTxHash !== undefined && !op.settled,
  )

  return useQuery({
    enabled: !!address && networkType === 'mainnet',
    queryFn: () => fetchEarnTransactions({ account: address! }),
    queryKey: [...earnTransactionsKeyPrefix, networkType, address],
    refetchInterval(query) {
      const subgraphData = (query.state.data ?? []) as EarnTransaction[]
      const hasSubgraphInFlight = subgraphData.some(
        t =>
          t.status !== 'FINALIZED' &&
          t.status !== 'RECOVERED' &&
          t.status !== 'FAILED' &&
          // A DEPOSIT CANCELLED still walks to RECOVERED; only a REDEEM
          // CANCELLED is terminal (withdrawal canceled).
          !(t.status === 'CANCELLED' && t.kind === 'REDEEM'),
      )
      return hasSubgraphInFlight || inFlightLocalsExist ? 10_000 : false
    },
  })
}
