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

// Composes the per-pool view out of the registry of shares plus two
// independent side queries: TVL (one read per share, on-chain) and APY
// (a single shared HTTP call whose response is keyed by vault address).
// Each piece keeps its own freshness lifecycle — TVL is invalidated by
// deposit/withdraw, APY refetches on a 5-minute interval — and we just
// pick the resolved values up here at render time.
export const useEarnPools = function () {
  const [networkType] = useNetworkType()
  const {
    data: shares = [],
    isError: isSharesError,
    isPending: isSharesPending,
  } = useHemiEarnShares()

  // TVL queries are intentionally NOT part of `isPending`: the page should
  // render with a `0n` placeholder while the cross-chain read is in flight.
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
    totalDeposits: tvlQueries[index]?.data ?? BigInt(0),
  }))

  return { data, isError: isSharesError, isPending: isSharesPending }
}
