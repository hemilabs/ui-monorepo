'use client'

import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'

import { formatApyDisplay } from '../_utils'
import { type EarnCardData } from '../types'

import { useHemiEarnTokens } from './useHemiEarnTokens'

type TotalAvgApyData = EarnCardData & { apy: number }

// TODO: this is a placeholder until we have the actual APY data available.
export const useTotalAvgApy = function () {
  const [networkType] = useNetworkType()
  const { data: vaultTokens = [] } = useHemiEarnTokens()

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
        vaultBreakdown: vaultTokens.map(({ token }) => ({
          name: token.symbol,
          tokenAddress: token.address,
          tokenChainId: token.chainId,
          value: formatApyDisplay(0),
        })),
        vaultCount: vaultTokens.length,
      }
    : undefined

  return { data, isError, isPending }
}
