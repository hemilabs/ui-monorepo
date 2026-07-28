'use client'

import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { useAccount } from 'wagmi'

import {
  earnCostBasisKeyPrefix,
  fetchEarnCostBasis,
} from '../_fetchers/fetchEarnCostBasis'

export const useEarnCostBasis = function () {
  const [networkType] = useNetworkType()
  const { address } = useAccount()

  return useQuery({
    enabled: !!address && networkType === 'mainnet',
    queryFn: () => fetchEarnCostBasis({ account: address! }),
    queryKey: [...earnCostBasisKeyPrefix, networkType, address],
  })
}
