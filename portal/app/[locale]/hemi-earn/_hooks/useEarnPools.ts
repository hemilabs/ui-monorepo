'use client'

import { useQueries, useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'

import { type EarnPool } from '../types'

import {
  earnApyQueryOptions,
  isApyApiConfigured,
  selectApyValue,
} from './useEarnApy'
import { earnTvlQueryOptions } from './useEarnTvl'
import { useHemiEarnShares } from './useHemiEarnShares'

// Combines the shares registry with independent TVL (per-share) and APY (one shared call) queries, each with its own freshness.
export const useEarnPools = function () {
  const [networkType] = useNetworkType()
  const {
    data: shares = [],
    isError: isSharesError,
    isPending: isSharesPending,
  } = useHemiEarnShares()

  // TVL is deliberately out of isPending: the page renders immediately and each cell shows its own skeleton via totalDepositsStatus.
  const tvlQueries = useQueries({
    queries: shares.map(share => ({
      ...earnTvlQueryOptions({
        networkType,
        stakingVault: share.stakingVault,
      }),
      enabled: shares.length > 0,
    })),
  })

  const { data: apyByVault, isPending: isApyQueryPending } = useQuery(
    earnApyQueryOptions(),
  )
  const isApyPending = isApyApiConfigured && isApyQueryPending

  const data: EarnPool[] = shares.map((share, index) => ({
    apy: selectApyValue(apyByVault, isApyPending, share.stakingVault),
    assets: share.assets,
    exposureTokens: share.assets.map(a => ({
      address: a.address,
      chainId: a.token.chainId,
    })),
    peggedToken: share.peggedToken,
    shareAddress: share.shareAddress,
    shareToken: share.shareToken,
    stakingVault: share.stakingVault,
    totalDeposits: tvlQueries[index]?.data,
    totalDepositsStatus: tvlQueries[index]?.status ?? 'pending',
  }))

  return { data, isError: isSharesError, isPending: isSharesPending }
}
