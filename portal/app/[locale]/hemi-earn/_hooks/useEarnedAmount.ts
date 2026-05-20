'use client'

import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'

// TODO: placeholder mock — returns $0 until the earned-amount data source is available.
export const useEarnedAmount = function () {
  const [networkType] = useNetworkType()

  const { data, isError, isPending } = useQuery<{ totalUsd: number }>({
    queryFn: () =>
      new Promise(resolve => setTimeout(() => resolve({ totalUsd: 0 }), 2000)),
    queryKey: ['hemi-earn', 'earned-amount', networkType],
  })

  return { data, isError, isPending }
}
