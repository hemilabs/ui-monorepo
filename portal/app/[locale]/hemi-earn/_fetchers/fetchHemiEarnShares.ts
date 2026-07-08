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

// Pegged tokens have no oracle; price them by aliasing to a whitelisted proxy
// (BTC→WBTC, USD→USDT) via priceSymbol.
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

  // Resolve via the shared token query; the pegged token is on Ethereum, share/deposit tokens on Hemi (each on its own chain).
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

  // A share accepts several deposit assets, so configs repeat it — one skeleton per unique share to avoid duplicate pools.
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
      // Price the pegged token via its gateway's peg base; resolve the gateway from the staking vault and tag it with the feed symbol.
      const gatewayAddress = await queryClient.ensureQueryData(
        gatewayForRemoteShareQueryOptions(remoteShare),
      )
      const pegBaseSymbol = gateways.find(gateway =>
        isAddressEqual(gateway.address, gatewayAddress),
      )?.pegBaseSymbol
      const priceSymbol = pegBaseSymbol
        ? pegBaseToPriceSymbol[pegBaseSymbol]
        : undefined
      // Build a new token, don't mutate — the resolved token is a shared cached reference.
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
