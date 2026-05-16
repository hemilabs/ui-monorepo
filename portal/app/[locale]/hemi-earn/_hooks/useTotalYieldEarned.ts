'use client'

import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { formatFiatNumber } from 'utils/format'

import { type EarnCardData } from '../types'

import { useHemiEarnShares } from './useHemiEarnShares'

type TotalYieldEarnedData = EarnCardData & { totalUsd: number }

// TODO: this is a placeholder until we have the actual APY data available.
export const useTotalYieldEarned = function () {
  const [networkType] = useNetworkType()
  const { data: shares = [] } = useHemiEarnShares()

  const {
    data: queryData,
    isError,
    isPending,
  } = useQuery<{ totalUsd: number }>({
    queryFn: () =>
      new Promise(resolve => setTimeout(() => resolve({ totalUsd: 0 }), 2000)),
    queryKey: ['hemi-earn', 'total-yield-earned', networkType],
  })

  const data: TotalYieldEarnedData | undefined = queryData
    ? {
        poolBreakdown: shares.map(share => ({
          name: share.shareToken.symbol,
          tokenAddress: share.shareToken.address,
          tokenChainId: share.shareToken.chainId,
          value: `$${formatFiatNumber(0)}`,
        })),
        poolCount: shares.length,
        totalUsd: queryData.totalUsd,
      }
    : undefined

  return { data, isError, isPending }
}
