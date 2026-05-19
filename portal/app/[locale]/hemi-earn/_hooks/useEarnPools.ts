'use client'

import { useQueries } from '@tanstack/react-query'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { useNetworkType } from 'hooks/useNetworkType'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { totalAssets } from 'viem-erc4626/actions'

import { type EarnPool } from '../types'

import { useHemiEarnShares } from './useHemiEarnShares'

export const getEarnPoolTotalAssetsQueryKey = ({
  networkType,
  shareAddress,
}: {
  networkType: string
  shareAddress: string
}) => ['hemi-earn', 'pools', networkType, shareAddress, 'totalAssets']

// TODO(phase-2): APY is still mocked. The real value comes from a
// share-price time series on the StakingVault (or a subgraph aggregating
// yield-distributor events). The Router refactor surfaces TVL via
// `totalAssets`; APY needs its own pipeline before this hook can drop
// the placeholder.
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

  const data: EarnPool[] = shares.map((share, index) => ({
    apy: { base: 0, incentivized: 0, total: 0 },
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
