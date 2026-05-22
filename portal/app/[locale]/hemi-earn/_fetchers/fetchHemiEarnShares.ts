import { type QueryClient, queryOptions } from '@tanstack/react-query'
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

export type ShareSkeleton = Pick<
  EarnPool,
  'assets' | 'peggedToken' | 'shareAddress' | 'shareToken'
>

export const peggedTokenForShareQueryOptions = (shareAddress: Address) =>
  queryOptions({
    queryFn: () =>
      getPeggedTokenForShare(getEvmL1PublicClient(mainnet.id), shareAddress),
    queryKey: ['hemi-earn', 'pegged-token-for-share', shareAddress],
    staleTime: Infinity,
  })

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

export const fetchHemiEarnShares = async function ({
  queryClient,
}: {
  queryClient: QueryClient
}): Promise<ShareSkeleton[]> {
  const supportedAssets = getHemiEarnSupportedAssets()
  const shareAddresses = getHemiEarnShares()

  const skeletons = await Promise.all(
    shareAddresses.map(async function (shareAddress) {
      const peggedAddress = await queryClient.ensureQueryData(
        peggedTokenForShareQueryOptions(shareAddress),
      )
      const shareToken = getHemiEarnToken(shareAddress, hemi.id)
      const peggedToken = getHemiEarnToken(peggedAddress, hemi.id)
      if (!shareToken || !peggedToken) return null
      const assets = supportedAssets
        .filter(entry => isAddressEqual(entry.share, shareAddress))
        .flatMap(entry => buildAsset(entry.asset))
      if (assets.length === 0) return null
      return { assets, peggedToken, shareAddress, shareToken }
    }),
  )

  return skeletons.filter((s): s is ShareSkeleton => s !== null)
}

export const hemiEarnSharesQueryOptions = ({
  queryClient,
}: {
  queryClient: QueryClient
}) =>
  queryOptions({
    queryFn: () => fetchHemiEarnShares({ queryClient }),
    queryKey: ['hemi-earn', 'shares'],
    staleTime: Infinity,
  })
