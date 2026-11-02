import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { useAccount } from 'wagmi'

import { isVetroApiConfigured, vetroApiUrl } from '../_constants/vetro'
import {
  earnTransactionsKeyPrefix,
  fetchEarnTransactions,
} from '../_fetchers/fetchEarnTransactions'
import { hasInFlightEarnActions } from '../_utils/earnRows'
import { type EarnTransaction } from '../types'

import { useLocalEarnOperations } from './useLocalEarnOperations'

// Raw Vetro /hemi-earn/requests query shared by useEarnTransactions (merge) and
// useEarnDeliveryWatcher (side effects); RQ dedupes to one fetch per interval. Polls every
// 10s while any row is in flight or a local entry isn't indexed yet; stops on the terminals.
export const useEarnTransactionsQuery = function () {
  const [networkType] = useNetworkType()
  const { address } = useAccount()
  const { localOperations } = useLocalEarnOperations()

  return useQuery({
    enabled: isVetroApiConfigured && !!address && networkType === 'mainnet',
    queryFn: () =>
      fetchEarnTransactions({ account: address!, apiUrl: vetroApiUrl! }),
    queryKey: [...earnTransactionsKeyPrefix, networkType, address],
    refetchInterval(query) {
      const transactions = (query.state.data ?? []) as EarnTransaction[]
      return hasInFlightEarnActions({ localOperations, transactions })
        ? 10_000
        : false
    },
    retry: 2,
  })
}
