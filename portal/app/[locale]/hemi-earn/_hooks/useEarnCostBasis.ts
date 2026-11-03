import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { useAccount } from 'wagmi'

import { isVetroApiConfigured, vetroApiUrl } from '../_constants/vetro'
import {
  earnCostBasisKeyPrefix,
  fetchEarnCostBasis,
} from '../_fetchers/fetchEarnCostBasis'
import { hasInFlightEarnActions } from '../_utils/earnRows'

import { useEarnTransactionsQuery } from './useEarnTransactionsQuery'
import { useLocalEarnOperations } from './useLocalEarnOperations'

export const useEarnCostBasis = function () {
  const [networkType] = useNetworkType()
  const { address } = useAccount()
  const { data: transactions = [] } = useEarnTransactionsQuery()
  const { localOperations } = useLocalEarnOperations()

  return useQuery({
    enabled: isVetroApiConfigured && !!address && networkType === 'mainnet',
    queryFn: () =>
      fetchEarnCostBasis({ account: address!, apiUrl: vetroApiUrl! }),
    queryKey: [...earnCostBasisKeyPrefix, networkType, address],
    refetchInterval: hasInFlightEarnActions({ localOperations, transactions })
      ? 10_000
      : false,
    retry: 2,
  })
}
