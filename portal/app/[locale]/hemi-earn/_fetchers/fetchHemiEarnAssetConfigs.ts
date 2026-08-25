import { queryOptions } from '@tanstack/react-query'
import { gateways } from '@vetro-protocol/gateway'
import { getTreasury } from '@vetro-protocol/gateway/actions'
import { getWhitelistedTokens } from '@vetro-protocol/treasury/actions'
import { type AssetData, getAssetData } from 'hemi-earn-actions/actions'
import { hemi } from 'hemi-viem'
import { mainnet } from 'networks/mainnet'
import { tokenList } from 'tokenList'
import { toChecksumAddress } from 'utils/address'
import { getPublicClient } from 'utils/chainClients'
import { type Address, type Chain, isAddressEqual, zeroAddress } from 'viem'

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
const fetchWhitelistedL1Tokens = async function (chainId: Chain['id']) {
  const l1Client = getPublicClient(chainId)
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
const findHemiToken =
  ({
    l1ChainId,
    l2ChainId,
  }: {
    l1ChainId: Chain['id']
    l2ChainId: Chain['id']
  }) =>
  (l1Address: Address) =>
    tokenList.tokens.find(function (token) {
      if (token.chainId !== l2ChainId) {
        return false
      }
      const hemiTokenL1Address =
        token.extensions?.bridgeInfo?.[l1ChainId]?.tokenAddress ??
        token.extensions?.oft?.peers?.[l1ChainId]?.tokenAddress
      return (
        hemiTokenL1Address !== undefined &&
        isAddressEqual(hemiTokenL1Address, l1Address)
      )
    })

// Builds the Hemi Earn asset registry on-chain: each gateway's whitelisted
// Ethereum tokens → their Hemi counterparts → `Router.assetsData`.
const fetchHemiEarnAssetConfigs = async function (): Promise<
  HemiEarnAssetConfig[]
> {
  const hemiClient = getPublicClient(hemi.id)
  const l1Tokens = await fetchWhitelistedL1Tokens(mainnet.id)

  const hemiAssets = l1Tokens
    .map(findHemiToken({ l1ChainId: mainnet.id, l2ChainId: hemi.id }))
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
