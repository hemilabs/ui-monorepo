import { type Address, zeroAddress } from 'viem'

// Pair of (deposit asset on Hemi, share token returned on Hemi). Multiple
// assets can share the same `share` (e.g. hemiBTC, WBTC, cbBTC all map to the
// svetBTC OFT). Mirrors `Router.assetsData[asset]` on-chain, minus the
// Ethereum-side `remoteAsset` which is irrelevant on the Hemi-side client.
export type HemiEarnAsset = {
  asset: Address
  share: Address
}

// TODO: placeholder — replace with the deployed Router on Hemi mainnet once available.
export const HEMI_EARN_ROUTER_ADDRESS: Address = zeroAddress

// TODO: placeholder — replace each entry with the corresponding deposit asset
// + share token OFT addresses on Hemi once deployed.
//
// First batch is the vetBTC pool: three BTC variants paired with the svetBTC
// OFT. Additional Vetro pools (e.g. VUSD with USDC/USDT) can be appended as
// new entries sharing their own `share` token.
export const HEMI_EARN_SUPPORTED_ASSETS: readonly HemiEarnAsset[] = [
  { asset: zeroAddress, share: zeroAddress }, // hemiBTC OFT → svetBTC OFT
  { asset: zeroAddress, share: zeroAddress }, // WBTC OFT    → svetBTC OFT
  { asset: zeroAddress, share: zeroAddress }, // cbBTC OFT   → svetBTC OFT
] as const

export const getHemiEarnRouterAddress = (): Address => HEMI_EARN_ROUTER_ADDRESS

export const getHemiEarnSupportedAssets = (): HemiEarnAsset[] => [
  ...HEMI_EARN_SUPPORTED_ASSETS,
]

// Looks up the share token an asset settles to. Throws when the asset is not
// registered so callers fail loudly instead of silently passing zeroAddress
// downstream.
export const getHemiEarnShareForAsset = function (asset: Address): Address {
  const entry = HEMI_EARN_SUPPORTED_ASSETS.find(e => e.asset === asset)
  if (!entry) {
    throw new Error(`Asset not registered in Hemi Earn: ${asset}`)
  }
  return entry.share
}
