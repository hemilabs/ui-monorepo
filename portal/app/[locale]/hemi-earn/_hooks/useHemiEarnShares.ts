'use client'

import {
  getHemiEarnShares,
  getHemiEarnSupportedAssets,
  getPeggedTokenForShare,
} from 'hemi-earn-actions'
import { hemi } from 'hemi-viem'
import { type Address, isAddressEqual } from 'viem'

import { getHemiEarnToken } from '../_constants/tokens'
import { type EarnAsset, type EarnPool } from '../types'

// Skeleton view of each Vetro share vault: one entry per distinct share OFT
// registered on the Router, plus every deposit asset that settles into it.
// Both lists come from `hemi-earn-actions` (the package). Token metadata
// (symbol/decimals/logoURI) is resolved synchronously from the curated
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
  const data: ShareSkeleton[] = []

  for (const shareAddress of getHemiEarnShares()) {
    const shareToken = getHemiEarnToken(shareAddress, hemi.id)
    const peggedToken = getHemiEarnToken(
      getPeggedTokenForShare(shareAddress),
      hemi.id,
    )
    if (!shareToken || !peggedToken) continue
    const assets = supportedAssets
      .filter(entry => isAddressEqual(entry.share, shareAddress))
      .flatMap(entry => buildAsset(entry.asset))
    if (assets.length === 0) continue
    data.push({ assets, peggedToken, shareAddress, shareToken })
  }

  return { data, isError: false, isPending: false }
}
