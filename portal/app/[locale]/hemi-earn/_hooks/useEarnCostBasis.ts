import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { useAccount } from 'wagmi'

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
    enabled: !!address && networkType === 'mainnet',
    queryFn: () => fetchEarnCostBasis({ account: address! }),
    queryKey: [...earnCostBasisKeyPrefix, networkType, address],
    refetchInterval: hasInFlightEarnActions({ localOperations, transactions })
      ? 10_000
      : false,
  })
}
