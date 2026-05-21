'use client'

import { useQueries, useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { useNetworkType } from 'hooks/useNetworkType'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { isValidUrl } from 'utils/url'
import { type Address } from 'viem'
import { totalAssets } from 'viem-erc4626/actions'

import { type EarnPool } from '../types'

import { useHemiEarnShares } from './useHemiEarnShares'

const apiUrl = process.env.NEXT_PUBLIC_VETRO_API_URL
const isApiConfigured = apiUrl !== undefined && isValidUrl(apiUrl)

type ApyResponse = Record<Address, { '7d': number }>

export const getEarnPoolTotalAssetsQueryKey = ({
  networkType,
  shareAddress,
}: {
  networkType: string
  shareAddress: string
}) => ['hemi-earn', 'pools', networkType, shareAddress, 'totalAssets']

// APY now comes from the Vetro HTTP API (`${VETRO_API}/variable-stake/apy`),
// keyed by staking-vault address. Long-term we may host our own service, but
// for now we piggyback on Vetro's endpoint to avoid running a parallel
// yield-aggregation pipeline. TVL still reads on-chain via the StakingVault.
export const useEarnPools = function () {
  const [networkType] = useNetworkType()
  const {
    data: shares = [],
    isError: isSharesError,
    isPending: isSharesPending,
  } = useHemiEarnShares()

  // TVL reads hit Ethereum L1 (the StakingVault). They're intentionally NOT
  // part of `isPending` below: the page must be able to render with placeholder
  // TVL while the cross-chain read is in flight (especially on the anvil
  // sandbox where the L1 RPC may not actually serve the StakingVault address).
  // `totalDeposits` falls back to `0n` until the query resolves.
  const tvlQueries = useQueries({
    queries: shares.map(share => ({
      enabled: shares.length > 0,
      queryFn: () =>
        totalAssets(getEvmL1PublicClient(mainnet.id), {
          address: getStakingVaultForShare(share.shareAddress),
        }),
      queryKey: getEarnPoolTotalAssetsQueryKey({
        networkType,
        shareAddress: share.shareAddress,
      }),
      // Fail fast instead of retrying 3× with exponential backoff — a missing
      // L1 RPC config (or a sandbox setup without an Ethereum-side mirror)
      // shouldn't keep the UI in a pending state for ~7s on every page load.
      retry: false,
    })),
  })

  // A single shared query fans the response out to every share via `select`,
  // so we don't issue one HTTP call per pool.
  const { data: apyByVault, isPending: isApyQueryPending } = useQuery({
    enabled: isApiConfigured,
    queryFn: () =>
      fetch(`${apiUrl}/variable-stake/apy`) as Promise<ApyResponse>,
    queryKey: ['hemi-earn', 'apy'],
    refetchInterval: 5 * 60 * 1000, // refetch every 5 min
    retry: 2,
  })

  // When the API isn't configured the query stays disabled and react-query
  // keeps reporting `isPending: true` indefinitely; treat that as settled-with-
  // no-value (`null`) so the UI falls through to '-' instead of showing a
  // permanent skeleton.
  const isApyPending = isApiConfigured && isApyQueryPending

  const data: EarnPool[] = shares.map((share, index) => ({
    // `undefined` while loading, `null` once settled if the value is missing
    // (errored or not in response) so consumers can distinguish skeleton vs '-'.
    apy: isApyPending
      ? undefined
      : apyByVault?.[getStakingVaultForShare(share.shareAddress)]?.['7d'] ??
        null,
    assets: share.assets,
    exposureTokens: share.assets.map(a => ({
      address: a.address,
      chainId: a.token.chainId,
    })),
    peggedToken: share.peggedToken,
    shareAddress: share.shareAddress,
    shareToken: share.shareToken,
    totalDeposits: tvlQueries[index]?.data ?? BigInt(0),
  }))

  return { data, isError: isSharesError, isPending: isSharesPending }
}
