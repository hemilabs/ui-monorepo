'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import Big from 'big.js'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { formatFiatNumber } from 'utils/format'
import { getTokenPrice } from 'utils/token'
import { formatUnits } from 'viem'
import { useAccount, useConfig } from 'wagmi'
import { getPublicClient } from 'wagmi/actions'

import { type EarnCardData } from '../types'
import { userVaultBalanceQueryOptions } from '../vault/[vaultAddress]/_hooks/useUserVaultBalance'

import { useHemiEarnTokens } from './useHemiEarnTokens'

export const totalDepositsKeyPrefix = ['hemi-earn', 'total-deposits']

type TotalDepositsData = EarnCardData & { totalUsd: string }

export const useTotalDeposits = function () {
  const [networkType] = useNetworkType()
  const { address } = useAccount()
  const config = useConfig()
  const queryClient = useQueryClient()
  const { data: vaultTokens = [] } = useHemiEarnTokens()
  const { data: prices } = useTokenPrices()

  const {
    data: deposits,
    isError,
    isPending,
  } = useQuery({
    enabled: !!address && vaultTokens.length > 0,
    async queryFn() {
      const balances = await Promise.all(
        vaultTokens.map(({ token, vaultAddress }) =>
          queryClient.ensureQueryData(
            userVaultBalanceQueryOptions({
              address: address!,
              chainId: token.chainId,
              client: getPublicClient(config, { chainId: token.chainId })!,
              vaultAddress,
            }),
          ),
        ),
      )
      return vaultTokens.map(({ token, vaultAddress }, index) => ({
        amount: balances[index] ?? BigInt(0),
        token,
        vaultAddress,
      }))
    },
    queryKey: [
      ...totalDepositsKeyPrefix,
      networkType,
      address,
      vaultTokens.map(vt => vt.vaultAddress),
    ],
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
          .toFixed(),
        vaultBreakdown: deposits.map(({ amount, token }) => ({
          name: token.symbol,
          tokenAddress: token.address,
          tokenChainId: token.chainId,
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
