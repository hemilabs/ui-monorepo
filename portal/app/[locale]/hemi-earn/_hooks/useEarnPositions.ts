'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { useAccount } from 'wagmi'

import {
  earnPositionsKeyPrefix,
  fetchEarnPositions,
} from '../_fetchers/fetchEarnPositions'

export const useEarnPositions = function () {
  const [networkType] = useNetworkType()
  const { address } = useAccount()
  const queryClient = useQueryClient()

  const { data, isError, isLoading } = useQuery({
    enabled: !!address,
    queryFn: () =>
      fetchEarnPositions({ account: address!, networkType, queryClient }),
    queryKey: [...earnPositionsKeyPrefix, networkType, address],
  })

  return { data: data ?? [], isError, isPending: isLoading }
}
