'use client'

import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'

import { formatApyDisplay } from '../_utils'
import { type EarnCardData } from '../types'

import { useHemiEarnTokens } from './useHemiEarnTokens'

type TotalAvgApyData = EarnCardData & { apy: number }

export const useTotalAvgApy = function () {
  const { id } = useHemi()
  const tokens = useHemiEarnTokens()

  const {
    data: queryData,
    isError,
    isPending,
  } = useQuery<{ apy: number }>({
    queryFn: () =>
      new Promise(resolve => setTimeout(() => resolve({ apy: 0 }), 2000)),
    queryKey: ['hemi-earn', 'total-avg-apy', id],
  })

  const data: TotalAvgApyData | undefined = queryData
    ? {
        apy: queryData.apy,
        vaultBreakdown: tokens.map(token => ({
          name: token.symbol,
          tokenAddress: token.address,
          tokenChainId: id,
          value: formatApyDisplay(0),
        })),
        vaultCount: tokens.length,
      }
    : undefined

  return { data, isError, isPending }
}
