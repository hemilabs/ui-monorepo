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

// Raw subgraph query shared by useEarnTransactions (merge) and useEarnDeliveryWatcher
// (side effects); RQ dedupes to one fetch per interval. Polls every 10s while any row
// is in flight or a local entry isn't indexed yet; stops on the terminals.
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
