'use client'

import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'

import { formatApyDisplay } from '../_utils'
import { type EarnCardData } from '../types'

import { useHemiEarnShares } from './useHemiEarnShares'

type TotalAvgApyData = EarnCardData & { apy: number }

// TODO: this is a placeholder until we have the actual APY data available.
export const useTotalAvgApy = function () {
  const [networkType] = useNetworkType()
  const { data: shares = [] } = useHemiEarnShares()

  const {
    data: queryData,
    isError,
    isPending,
  } = useQuery<{ apy: number }>({
    queryFn: () =>
      new Promise(resolve => setTimeout(() => resolve({ apy: 0 }), 2000)),
    queryKey: ['hemi-earn', 'total-avg-apy', networkType],
  })

  const data: TotalAvgApyData | undefined = queryData
    ? {
        apy: queryData.apy,
        poolBreakdown: shares.map(share => ({
          name: share.shareToken.symbol,
          tokenAddress: share.shareToken.address,
          tokenChainId: share.shareToken.chainId,
          value: formatApyDisplay(0),
        })),
        poolCount: shares.length,
      }
    : undefined

  return { data, isError, isPending }
}
