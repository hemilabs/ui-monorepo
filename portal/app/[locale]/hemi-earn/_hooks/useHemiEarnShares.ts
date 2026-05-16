'use client'

import { getHemiEarnShares, getPeggedTokenForShare } from 'hemi-earn-actions'
import { type RegistryEntry } from 'hemi-earn-actions/actions'
import { hemi } from 'hemi-viem'
import { type Address } from 'viem'

import { getHemiEarnToken } from '../_constants/tokens'
import { type EarnAsset, type EarnPool } from '../types'

import { useHemiEarnRegistry } from './useHemiEarnRegistry'

// Skeleton view of each Vetro share vault: one entry per distinct share OFT
// registered on the Router, plus every deposit asset that settles into it.
// Share addresses come from `hemi-earn-actions` (the package); asset
// addresses come from the on-chain registry (`useHemiEarnRegistry`, parses
// `AssetDataUpdated` events). Token metadata (symbol/decimals/logoURI) is
// resolved synchronously from the curated `HEMI_EARN_TOKENS` list — mirrors
// Vetro's `knownTokens` pattern.
type ShareSkeleton = Pick<
  EarnPool,
  'assets' | 'peggedToken' | 'shareAddress' | 'shareToken'
>

// Anchor `EarnAsset.address` to the curated token entry's address rather
// than the raw event-log value. viem returns event-decoded addresses in
// checksum case, while `HEMI_EARN_TOKENS` stores them lowercase — using
// `token.address` here keeps both casings aligned across the app so the
// `useTokenBalance` queryKey matches between callers like `useDeposit`
// (passing `selectedAsset.address`) and `Balance` (passing
// `selectedAsset.token.address`). Without this, optimistic `setQueryData`
// after a deposit lands on a different cache entry than the one the
// balance UI is subscribed to.
function buildAsset(address: Address): EarnAsset[] {
  const token = getHemiEarnToken(address, hemi.id)
  return token ? [{ address: token.address as Address, token }] : []
}

function buildSharesData(registry: RegistryEntry[]) {
  const result: ShareSkeleton[] = []
  for (const shareAddress of getHemiEarnShares()) {
    const shareToken = getHemiEarnToken(shareAddress, hemi.id)
    const peggedToken = getHemiEarnToken(
      getPeggedTokenForShare(shareAddress),
      hemi.id,
    )
    if (!shareToken || !peggedToken) continue
    const assets = registry
      .filter(entry => entry.share.toLowerCase() === shareAddress.toLowerCase())
      .flatMap(entry => buildAsset(entry.asset))
    if (assets.length === 0) continue
    result.push({ assets, peggedToken, shareAddress, shareToken })
  }
  return result
}

export const useHemiEarnShares = function () {
  const { data: registry, isError, isPending } = useHemiEarnRegistry()
  return {
    data: registry ? buildSharesData(registry) : undefined,
    isError,
    isPending,
  }
}
