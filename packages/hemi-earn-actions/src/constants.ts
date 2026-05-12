import { type Address, zeroAddress } from 'viem'

// TODO: placeholder — replace with the deployed Router on Hemi mainnet once available.
export const HEMI_EARN_ROUTER_ADDRESS: Address = zeroAddress

// TODO: placeholder — replace with the sVetBTC OFT address on Hemi once deployed.
export const HEMI_EARN_SHARE_TOKEN: Address = zeroAddress

// TODO: placeholder — replace each zeroAddress with the corresponding OFT on Hemi
// (hemiBTC OFT, WBTC OFT, cbBTC OFT) once the deposit assets are deployed.
export const HEMI_EARN_SUPPORTED_ASSETS: readonly Address[] = [
  zeroAddress,
  zeroAddress,
  zeroAddress,
] as const

export const getHemiEarnRouterAddress = (): Address => HEMI_EARN_ROUTER_ADDRESS

export const getHemiEarnShareToken = (): Address => HEMI_EARN_SHARE_TOKEN

export const getHemiEarnSupportedAssets = (): Address[] => [
  ...HEMI_EARN_SUPPORTED_ASSETS,
]
