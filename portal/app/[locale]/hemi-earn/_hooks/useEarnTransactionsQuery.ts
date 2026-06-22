'use client'

import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { useAccount } from 'wagmi'

import {
  earnTransactionsKeyPrefix,
  fetchEarnTransactions,
} from '../_fetchers/fetchEarnTransactions'
import { isEarnRowInFlight } from '../_utils'
import { type EarnTransaction } from '../types'

import { useLocalEarnOperations } from './useLocalEarnOperations'

// Raw subgraph query. Internal building block shared by `useEarnTransactions`
// (which merges with local entries for the table) and `useEarnDeliveryWatcher`
// (which runs the reconcile + invalidation side effects against the raw
// subgraph view). React Query dedupes the underlying fetch across both
// consumers — a single network call per interval drives every subscriber.
//
// Polling: every 10s while a row is in flight (`isEarnRowInFlight`: cross-chain
// pending, auto-claim/auto-recover progressing, a deposit awaiting recovery,
// cooldown maturing) or a local entry hasn't shown up in the subgraph yet.
// Stops on the terminals (FINALIZED/RECOVERED/FAILED and a REDEEM CANCELLED).
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
      return inFlightLocalsExist || subgraphData.some(isEarnRowInFlight)
        ? 10_000
        : false
    },
  })
}
