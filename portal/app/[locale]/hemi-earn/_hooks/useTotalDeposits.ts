'use client'

import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { useAccount } from 'wagmi'

import { type EarnCardData } from '../types'

import { useHemiEarnTokens } from './useHemiEarnTokens'

export const totalDepositsKeyPrefix = ['hemi-earn', 'total-deposits']

type TotalDepositsData = EarnCardData & { totalUsd: string }

// TODO(phase-2): mocked intentionally. Depends on the real `useUserVaultBalance`
// hook and on share price reads from the StakingVault on Ethereum to convert
// shares into USD. Out of scope for the Router refactor.
export const useTotalDeposits = function () {
  const [networkType] = useNetworkType()
  const { address } = useAccount()
  const { data: vaultTokens = [] } = useHemiEarnTokens()

  const {
    data: deposits,
    isError,
    isPending,
  } = useQuery({
    enabled: !!address && vaultTokens.length > 0,
    // `initialData` keeps `isPending` false when the query is disabled
    // (no wallet connected or placeholder asset state). See the matching
    // note in `useEarnPools.ts`.
    initialData: [],
    queryFn: () =>
      vaultTokens.map(({ token, vaultAddress }) => ({
        amount: BigInt(0),
        token,
        vaultAddress,
      })),
    queryKey: [
      ...totalDepositsKeyPrefix,
      networkType,
      address,
      vaultTokens.map(vt => vt.vaultAddress),
    ],
  })

  const data: TotalDepositsData | undefined = deposits
    ? {
        totalUsd: '0',
        vaultBreakdown: deposits.map(({ token }) => ({
          name: token.symbol,
          tokenAddress: token.address,
          tokenChainId: token.chainId,
          value: '$0',
        })),
        vaultCount: deposits.length,
      }
    : undefined

  return { data, isError, isPending }
}
