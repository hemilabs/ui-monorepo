import { type QueryClient, queryOptions } from '@tanstack/react-query'
import { gateways } from '@vetro-protocol/gateway'
import { hemi } from 'hemi-viem'
import { tokenQueryOptions } from 'hooks/useToken'
import { mainnet } from 'networks/mainnet'
import { type RemoteChain } from 'types/chain'
import { type EvmToken } from 'types/token'
import { type Address, isAddressEqual } from 'viem'

import { gatewayForRemoteShareQueryOptions } from '../_hooks/gatewayForRemoteShare'
import { vaultAssetQueryOptions } from '../_hooks/vaultAsset'
import { type EarnAsset, type EarnPool } from '../types'

import {
  hemiEarnAssetConfigsQueryOptions,
  uniqueShareConfigs,
} from './fetchHemiEarnAssetConfigs'

export type ShareSkeleton = Pick<
  EarnPool,
  'assets' | 'peggedToken' | 'shareAddress' | 'shareToken' | 'stakingVault'
>

// Pegged tokens (vetBTC, VUSD) aren't in the curated token list, so they
// resolve via the erc20 fallback with no `priceSymbol`. They have no oracle of
// their own either, so — like vetro-4 — price them by aliasing to a
// whitelisted proxy token in their gateway. `useEarnTokenPrices` exposes those
// proxies' oracle-adjusted USD prices, and `getTokenPrice` reads the alias
// from `extensions.priceSymbol`.
const pegBaseToPriceSymbol: Record<string, string> = {
  BTC: 'WBTC',
  USD: 'USDT',
}

export const fetchHemiEarnShares = async function (
  queryClient: QueryClient,
): Promise<ShareSkeleton[]> {
  const configs = await queryClient.ensureQueryData(
    hemiEarnAssetConfigsQueryOptions(),
  )

  // Resolve token metadata (symbol, decimals, logo, priceSymbol) through the
  // shared token query — the curated token list with an on-chain erc20
  // fallback. The pegged token lives on Ethereum mainnet (the staking vault's
  // `asset()`), while share/deposit tokens are Hemi-side, so each is looked up
  // on its own chain. Returns `undefined` so the share/asset is skipped when
  // neither source resolves the token.
  const resolveToken = async function (
    address: Address,
    chainId: RemoteChain['id'],
  ): Promise<EvmToken | undefined> {
    try {
      return (await queryClient.ensureQueryData(
        tokenQueryOptions({ address, chainId }),
      )) as EvmToken
    } catch {
      return undefined
    }
  }

  // A share can accept several deposit assets, so the asset-config list repeats
  // `share`/`remoteShare`; build one skeleton per unique share to avoid
  // duplicate pools (and double-counted positions/TVL).
  const skeletons = await Promise.all(
    uniqueShareConfigs(configs).map(async function ({
      remoteShare,
      share: shareAddress,
    }) {
      const peggedAddress = await queryClient.ensureQueryData(
        vaultAssetQueryOptions(remoteShare),
      )
      const [shareToken, peggedToken] = await Promise.all([
        resolveToken(shareAddress, hemi.id),
        resolveToken(peggedAddress, mainnet.id),
      ])
      if (!shareToken || !peggedToken) {
        return null
      }
      // The pegged token's USD price comes from its gateway's peg base (e.g.
      // BTC for the vetBTC gateway, USD for VUSD). Resolve the gateway from the
      // staking vault (same path `fetchComposition` uses; the `asset()` leg is
      // already cached) and tag the pegged token with the matching feed symbol.
      const gatewayAddress = await queryClient.ensureQueryData(
        gatewayForRemoteShareQueryOptions(remoteShare),
      )
      const pegBaseSymbol = gateways.find(gateway =>
        isAddressEqual(gateway.address, gatewayAddress),
      )?.pegBaseSymbol
      const priceSymbol = pegBaseSymbol
        ? pegBaseToPriceSymbol[pegBaseSymbol]
        : undefined
      // Build a new token rather than mutate — the resolved token is a shared
      // cached reference. Fall back to the unpriced token for unmapped pegs.
      const pricedPeggedToken = priceSymbol
        ? {
            ...peggedToken,
            extensions: { ...peggedToken.extensions, priceSymbol },
          }
        : peggedToken
      const tokens = await Promise.all(
        configs
          .filter(entry => isAddressEqual(entry.share, shareAddress))
          .map(entry => resolveToken(entry.asset, hemi.id)),
      )
      const assets: EarnAsset[] = tokens
        .filter((token): token is EvmToken => token !== undefined)
        .map(token => ({ address: token.address as Address, token }))
      if (assets.length === 0) {
        return null
      }
      return {
        assets,
        peggedToken: pricedPeggedToken,
        shareAddress,
        shareToken,
        stakingVault: remoteShare,
      }
    }),
  )

  return skeletons.filter((s): s is ShareSkeleton => s !== null)
}

export const hemiEarnSharesQueryOptions = () =>
  queryOptions({
    queryFn: ({ client }) => fetchHemiEarnShares(client),
    queryKey: ['hemi-earn', 'shares'],
    staleTime: Infinity,
  })
