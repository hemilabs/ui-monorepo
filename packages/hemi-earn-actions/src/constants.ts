import { type Address, zeroAddress } from 'viem'

// TODO: placeholder — replace with the deployed Router on Hemi mainnet once
// the addresses are confirmed.
export const HEMI_EARN_ROUTER_ADDRESS: Address = zeroAddress

// TODO: placeholder — replace with the deployed Agent on Ethereum mainnet
// once the addresses are confirmed. Used by the portal to quote the
// LayerZero fulfillment fee from the remote chain.
export const HEMI_EARN_AGENT_ADDRESS: Address = zeroAddress

// Block at which the Router was deployed on Hemi. Used as `fromBlock` for the
// dynamic asset registry's `eth_getLogs` scan so we don't sweep the entire
// chain history (production RPCs cap the log range — typically 10k–50k blocks
// per call — and `fromBlock: 0n` would either error out or be very slow).
//
// TODO: replace with the deployment block of the production Router on Hemi
// mainnet once the addresses are confirmed. `0n` is fine on the anvil sandbox
// because the chain only has a few hundred blocks.
export const HEMI_EARN_ROUTER_BIRTH_BLOCK: bigint = BigInt(0)

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
// The asset → share registry is loaded dynamically at runtime via the
// `getAssetRegistry` public action (it reads `AssetDataUpdated` events from
// the Router), so adding a new asset to an existing share doesn't require
// a portal redeploy.
export const HEMI_EARN_SHARES: readonly Address[] = [
  SVETBTC_OFT_ADDRESS,
] as const

export const getHemiEarnRouterAddress = (): Address => HEMI_EARN_ROUTER_ADDRESS

export const getHemiEarnAgentAddress = (): Address => HEMI_EARN_AGENT_ADDRESS

export const getHemiEarnRouterBirthBlock = (): bigint =>
  HEMI_EARN_ROUTER_BIRTH_BLOCK

// Unique share OFT addresses registered on the Router. Used to enumerate
// share-keyed routes (`generateStaticParams`). Filters out `zeroAddress` so
// unconfigured rows don't leak into the UI.
export const getHemiEarnShares = (): Address[] =>
  HEMI_EARN_SHARES.filter(s => s !== zeroAddress)
