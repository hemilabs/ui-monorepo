'use client'

import { useQueries } from '@tanstack/react-query'
import {
  getHemiEarnShares,
  getHemiEarnSupportedAssets,
  getPeggedTokenForShare,
} from 'hemi-earn-actions'
import { hemi } from 'hemi-viem'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address, isAddressEqual } from 'viem'

import { getHemiEarnToken } from '../_constants/tokens'
import { type EarnAsset, type EarnPool } from '../types'

// Skeleton view of each Vetro share vault: one entry per distinct share OFT
// registered on the Router, plus every deposit asset that settles into it.
// The pegged-token address is read on-chain via the gateway's
// `PEGGED_TOKEN()` view (`getPeggedTokenForShare`); token metadata
// (symbol/decimals/logoURI) is then looked up in the curated
// `HEMI_EARN_TOKENS` list — mirrors Vetro's `knownTokens` pattern.
type ShareSkeleton = Pick<
  EarnPool,
  'assets' | 'peggedToken' | 'shareAddress' | 'shareToken'
>

// Anchor `EarnAsset.address` to the curated token entry's address rather
// than the raw constant value. `HEMI_EARN_TOKENS` stores addresses
// lowercased, and `useTokenBalance` keys queries off whatever address it
// was passed — using `token.address` here keeps both casings aligned across
// the app so optimistic `setQueryData` after a deposit lands on the same
// cache entry the balance UI is subscribed to.
function buildAsset(address: Address): EarnAsset[] {
  const token = getHemiEarnToken(address, hemi.id)
  return token ? [{ address: token.address as Address, token }] : []
}

export const useHemiEarnShares = function () {
  const supportedAssets = getHemiEarnSupportedAssets()
  const shareAddresses = getHemiEarnShares()

  const peggedQueries = useQueries({
    queries: shareAddresses.map(shareAddress => ({
      queryFn: () =>
        getPeggedTokenForShare(getEvmL1PublicClient(mainnet.id), shareAddress),
      queryKey: ['hemi-earn', 'pegged-token-for-share', shareAddress],
      staleTime: Infinity,
    })),
  })

  const data: ShareSkeleton[] = []
  for (let i = 0; i < shareAddresses.length; i++) {
    const shareAddress = shareAddresses[i]
    const peggedAddress = peggedQueries[i]?.data
    if (!peggedAddress) continue
    const shareToken = getHemiEarnToken(shareAddress, hemi.id)
    const peggedToken = getHemiEarnToken(peggedAddress, hemi.id)
    if (!shareToken || !peggedToken) continue
    const assets = supportedAssets
      .filter(entry => isAddressEqual(entry.share, shareAddress))
      .flatMap(entry => buildAsset(entry.asset))
    if (assets.length === 0) continue
    data.push({ assets, peggedToken, shareAddress, shareToken })
  }

  return {
    data,
    isError: peggedQueries.some(q => q.isError),
    isPending: peggedQueries.some(q => q.isPending),
  }
}
