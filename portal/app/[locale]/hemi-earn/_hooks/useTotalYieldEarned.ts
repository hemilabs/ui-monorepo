'use client'

import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { formatFiatNumber } from 'utils/format'

import { type EarnCardData } from '../types'

import { useHemiEarnTokens } from './useHemiEarnTokens'

type TotalYieldEarnedData = EarnCardData & { totalUsd: number }

// TODO: this is a placeholder until we have the actual APY data available.
export const useTotalYieldEarned = function () {
  const [networkType] = useNetworkType()
  const { data: vaultTokens = [] } = useHemiEarnTokens()

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
        totalUsd: queryData.totalUsd,
        vaultBreakdown: vaultTokens.map(({ token }) => ({
          name: token.symbol,
          tokenAddress: token.address,
          tokenChainId: token.chainId,
          value: `$${formatFiatNumber(0)}`,
        })),
        vaultCount: vaultTokens.length,
      }
    : undefined

  return { data, isError, isPending }
}
