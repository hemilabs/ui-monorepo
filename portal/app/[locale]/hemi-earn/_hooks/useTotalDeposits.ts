'use client'

import { useQuery } from '@tanstack/react-query'
import Big from 'big.js'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { formatFiatNumber } from 'utils/format'
import { getTokenPrice } from 'utils/token'
import { formatUnits } from 'viem'

import { fetchTotalDeposits } from '../_fetchers/fetchTotalDeposits'
import { type EarnCardData } from '../types'

import { useHemiEarnTokens } from './useHemiEarnTokens'

type TotalDepositsData = EarnCardData & { totalUsd: number }

export const useTotalDeposits = function () {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const { data: tokens = [] } = useHemiEarnTokens()
  const { data: prices } = useTokenPrices()

  const {
    data: deposits,
    isError,
    isPending,
  } = useQuery({
    enabled: tokens.length > 0,
    queryFn: () => fetchTotalDeposits({ chainId, client: hemiClient, tokens }),
    queryKey: ['hemi-earn', 'total-deposits', chainId],
  })

  const data: TotalDepositsData | undefined = deposits
    ? {
        totalUsd: deposits
          .reduce(
            (acc, { amount, token }) =>
              acc.plus(
                Big(formatUnits(amount, token.decimals)).times(
                  getTokenPrice(token, prices),
                ),
              ),
            Big(0),
          )
          .toNumber(),
        vaultBreakdown: deposits.map(({ amount, token }) => ({
          name: token.symbol,
          tokenAddress: token.address,
          tokenChainId: chainId,
          value: `$${formatFiatNumber(
            Big(formatUnits(amount, token.decimals))
              .times(getTokenPrice(token, prices))
              .toFixed(),
          )}`,
        })),
        vaultCount: deposits.length,
      }
    : undefined

  return { data, isError, isPending }
}
