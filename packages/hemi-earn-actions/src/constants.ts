import { type Address, isAddressEqual, zeroAddress } from 'viem'

// TODO: placeholder — replace with the deployed Router on Hemi mainnet once
// the addresses are confirmed.
export const HEMI_EARN_ROUTER_ADDRESS: Address = zeroAddress

// TODO: placeholder — replace with the deployed Agent on Ethereum mainnet
// once the addresses are confirmed. Used by the portal to quote the
// LayerZero fulfillment fee from the remote chain.
export const HEMI_EARN_AGENT_ADDRESS: Address = zeroAddress

// Named address constants for each share OFT registered on the Router.
// Exported individually so the portal (and other consumers) can import the
// canonical address without re-declaring it. Mirrors Vetro's pattern
// (`sVetBtcAddress`, `sVusdAddress` in `@vetro-protocol/earn`).
//
// TODO: placeholder — replace with the production svetBTC OFT on Hemi once
// the addresses are confirmed.
export const SVETBTC_OFT_ADDRESS: Address = zeroAddress

// Share OFTs registered on the Router. Kept static for two reasons:
//   1. `generateStaticParams` (build time) needs to know which `/pool/[share]`
//      routes to prerender, and that lookup can't hit the chain.
//   2. The set of share tokens changes much less often than the asset list
//      (a new asset routes into an existing share; new shares mean a brand
//      new product surface).
export const HEMI_EARN_SHARES: readonly Address[] = [
  SVETBTC_OFT_ADDRESS,
] as const

// One deposit asset registered on the Router. `asset` is the Hemi-side OFT
// the user holds and passes to `requestDeposit`; `share` is the share OFT
// it settles into (must be one of `HEMI_EARN_SHARES`).
export type HemiEarnAsset = {
  asset: Address
  share: Address
}

// Hardcoded asset → share registry. The Router exposes `assetsData(asset)`
// for per-key lookups but no enumeration view, so the portal mirrors the
// list here. Adding a new deposit asset to an existing share requires
// appending an entry and shipping a new portal build — tracked as a
// follow-up to migrate to a subgraph (or a contract-level enumeration
// getter) once one of those lands.
//
// TODO: populate with the `(asset OFT, share OFT)` pairs once
// SC team deploys.
export const HEMI_EARN_SUPPORTED_ASSETS: readonly HemiEarnAsset[] = [] as const

export const getHemiEarnRouterAddress = (): Address => HEMI_EARN_ROUTER_ADDRESS

export const getHemiEarnAgentAddress = (): Address => HEMI_EARN_AGENT_ADDRESS

// Unique share OFT addresses registered on the Router. Used to enumerate
// share-keyed routes (`generateStaticParams`). Filters out `zeroAddress` so
// unconfigured rows don't leak into the UI.
export const getHemiEarnShares = (): Address[] =>
  HEMI_EARN_SHARES.filter(s => !isAddressEqual(s, zeroAddress))

// Deposit assets registered for any of the active share OFTs. Filters out
// any entry whose `asset` or `share` is still the zero-address placeholder.
export const getHemiEarnSupportedAssets = (): HemiEarnAsset[] =>
  HEMI_EARN_SUPPORTED_ASSETS.filter(
    ({ asset, share }) =>
      !isAddressEqual(asset, zeroAddress) &&
      !isAddressEqual(share, zeroAddress),
  )
