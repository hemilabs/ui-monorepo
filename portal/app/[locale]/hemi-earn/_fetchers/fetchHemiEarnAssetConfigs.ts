import { queryOptions } from '@tanstack/react-query'
import { gateways } from '@vetro-protocol/gateway'
import { getTreasury } from '@vetro-protocol/gateway/actions'
import { getWhitelistedTokens } from '@vetro-protocol/treasury/actions'
import { type AssetData, getAssetData } from 'hemi-earn-actions/actions'
import { hemi } from 'hemi-viem'
import { hemiMainnet } from 'networks/hemiMainnet'
import { mainnet } from 'networks/mainnet'
import { tokenList } from 'tokenList'
import { toChecksumAddress } from 'utils/address'
import {
  type Address,
  createPublicClient,
  http,
  isAddressEqual,
  zeroAddress,
} from 'viem'

// Build-time `generateStaticParams` runs this on the server, so clients are
// constructed straight from the chain configs with a bare `http()` transport
// rather than via `getPublicClient`/`buildTransport`. Two reasons:
//   1. those resolve the chain through `findChainById`, which reads the
//      `'use client'` `networks` barrel — unavailable in a server (RSC) context;
//   2. `buildTransport` pulls in `eth-rpc-cache`, whose ESM resolution breaks
//      under vitest, so importing it here would take the fetcher's tests down.
// `http()` honors each chain's configured RPC and the result is cached by
// react-query (`staleTime: Infinity`), so the rpc-cache buys nothing here.
const l1PublicClient = () =>
  createPublicClient({ chain: mainnet, transport: http() })

const hemiPublicClient = () =>
  createPublicClient({ chain: hemiMainnet, transport: http() })

// One Router-registered deposit asset, resolved on-chain rather than hardcoded.
// Mirrors `Router.assetsData(asset)` (`AssetData`) plus the Hemi-side `asset`
// the user holds. `share` is the share OFT the asset settles into; `remoteShare`
// is the Ethereum-side staking vault; `remoteAsset` is the Ethereum-side asset
// the Agent uses on fulfillment — all carried so callers derive the pegged
// token / TVL / quotes without a second `assetsData` read.
export type HemiEarnAssetConfig = AssetData & {
  asset: Address
}

// One representative config per share OFT. A share can accept multiple deposit
// assets (e.g. USDC + USDT → sVUSD), so `share`/`remoteShare` repeat across
// configs while `asset` does not — consumers that key off the share (pools,
// TVL, static params) must dedupe first or they double-count.
export const uniqueShareConfigs = (configs: HemiEarnAssetConfig[]) => [
  ...new Map(
    configs.map(config => [config.share.toLowerCase(), config]),
  ).values(),
]

// Ethereum-side collateral tokens whitelisted across every Vetro gateway's
// treasury. Each gateway exposes its treasury (`getTreasury`) whose
// `getWhitelistedTokens` lists the accepted tokens. A token is whitelisted on
// at most one treasury, so the gateways' lists are disjoint — flatten and
// checksum them. Reads fail-fast (`Promise.all`): an unreadable gateway means
// a broken registry, so surface it and fail the build rather than ship a
// partial token set.
const fetchWhitelistedL1Tokens = async function () {
  const l1Client = l1PublicClient()
  const perGateway = await Promise.all(
    gateways.map(async function (gateway) {
      const treasury = await getTreasury(l1Client, { address: gateway.address })
      return getWhitelistedTokens(l1Client, { address: treasury })
    }),
  )
  return perGateway.flat().map(toChecksumAddress)
}

// Hemi-side counterpart of an Ethereum token, via the token list's
// `bridgeInfo` (standard bridge) or `oft.peers` (LayerZero OFT, e.g. hemiBTC)
// mapping. Returns `undefined` when the token has no Hemi version (e.g. not
// tunneled), so callers skip it.
const findHemiToken = (l1Address: Address) =>
  tokenList.tokens.find(function (token) {
    if (token.chainId !== hemi.id) {
      return false
    }
    const hemiTokenL1Address =
      token.extensions?.bridgeInfo?.[mainnet.id]?.tokenAddress ??
      token.extensions?.oft?.peers?.[mainnet.id]?.tokenAddress
    return (
      hemiTokenL1Address !== undefined &&
      isAddressEqual(hemiTokenL1Address, l1Address)
    )
  })

// Builds the Hemi Earn asset registry on-chain: each gateway's whitelisted
// Ethereum tokens → their Hemi counterparts → `Router.assetsData`. Pure async
// (no queryClient) so it can run at build time in `generateStaticParams`.
export const fetchHemiEarnAssetConfigs = async function (): Promise<
  HemiEarnAssetConfig[]
> {
  const hemiClient = hemiPublicClient()
  const l1Tokens = await fetchWhitelistedL1Tokens()

  const hemiAssets = l1Tokens
    .map(findHemiToken)
    .filter(token => token !== undefined)

  const configs = await Promise.all(
    hemiAssets.map(async function (token) {
      const asset = token.address as Address
      const data = await getAssetData(hemiClient, { asset })
      return { asset, ...data }
    }),
  )

  // `assetsData` is a mapping getter: it returns a zero-valued struct
  // (`share === zeroAddress`) for tokens the Router doesn't know — drop those.
  // Disabled assets revert `requestDeposit`/`requestRedeem`, so drop them too
  // rather than surface a pool the user can't actually deposit into.
  return configs.filter(
    config =>
      config.enabled !== false && !isAddressEqual(config.share, zeroAddress),
  )
}

export const hemiEarnAssetConfigsQueryOptions = () =>
  queryOptions({
    queryFn: fetchHemiEarnAssetConfigs,
    queryKey: ['hemi-earn', 'asset-configs'],
    staleTime: Infinity,
  })

// The config for a Hemi-side share OFT. Resolves through the cached
// asset-config list so every share-keyed consumer (TVL, cooldown, quotes…)
// shares the single on-chain enumeration instead of a hardcoded registry.
// `remoteShare` is the share's Ethereum-side staking vault. Throws when the
// share isn't registered so callers fail loudly instead of reading a wrong
// address. The gateway is identical across all of a share's assets, so the
// first matching config is representative.
export const shareConfigQueryOptions = (share: Address) =>
  queryOptions({
    async queryFn({ client }) {
      const configs = await client.ensureQueryData(
        hemiEarnAssetConfigsQueryOptions(),
      )
      const config = configs.find(c => isAddressEqual(c.share, share))
      if (config === undefined) {
        throw new Error(`Share not registered in Hemi Earn: ${share}`)
      }
      return config
    },
    queryKey: ['hemi-earn', 'share-config', share],
    staleTime: Infinity,
  })
