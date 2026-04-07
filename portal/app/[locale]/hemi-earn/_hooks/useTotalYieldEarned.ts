'use client'

import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { formatFiatNumber } from 'utils/format'

import { type EarnCardData } from '../types'

import { useHemiEarnTokens } from './useHemiEarnTokens'

type TotalYieldEarnedData = EarnCardData & { totalUsd: number }

export const useTotalYieldEarned = function () {
  const { id } = useHemi()
  const { data: vaultTokens = [] } = useHemiEarnTokens()

  const {
    data: queryData,
    isError,
    isPending,
  } = useQuery<{ totalUsd: number }>({
    queryFn: () =>
      new Promise(resolve => setTimeout(() => resolve({ totalUsd: 0 }), 2000)),
    queryKey: ['hemi-earn', 'total-yield-earned', id],
  })

  const data: TotalYieldEarnedData | undefined = queryData
    ? {
        totalUsd: queryData.totalUsd,
        vaultBreakdown: vaultTokens.map(({ token }) => ({
          name: token.symbol,
          tokenAddress: token.address,
          tokenChainId: id,
          value: `$${formatFiatNumber(0)}`,
        })),
        vaultCount: vaultTokens.length,
      }
    : undefined

  return { data, isError, isPending }
}
