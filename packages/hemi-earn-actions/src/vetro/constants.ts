import { type Address, isAddressEqual, zeroAddress } from 'viem'

// Maps a Hemi-side share OFT (e.g. sVUSD) to its Ethereum-side anchors:
//   - `stakingVault`: the ERC-4626 sVetToken contract on Ethereum (used for
//     convertToAssets/convertToShares/totalAssets reads).
//   - `gateway`: the Vetro gateway that converts deposit assets to/from the
//     vault's pegged token (used for previewDeposit/previewRedeem reads).
//   - `peggedToken`: the underlying pegged token (vBTC, vUSD) — what
//     `stakingVault.asset()` returns and what `convertToAssets` is denominated
//     in. Pricing share balances goes through the pegged token because it has
//     a known `priceSymbol` (BTC, USDT, …) in the portal token list.
// The Agent on Ethereum resolves the same set via on-chain reads
// (`assetsData(asset).asset().gateway()`); we mirror it here so the portal can
// preview cross-chain results without round-tripping to the Agent first.
export type HemiEarnVetroAnchor = {
  shareOft: Address
  stakingVault: Address
  gateway: Address
  peggedToken: Address
}

// TODO: placeholder — replace with the production vetBTC pegged token address
// on Ethereum once the addresses are confirmed.
export const VETBTC_PEGGED_ADDRESS: Address = zeroAddress

// TODO: placeholders — replace each entry with the real Vetro anchors
// (Hemi-side share OFT + Ethereum-side StakingVault, Gateway and pegged token)
// once the addresses are confirmed.
export const HEMI_EARN_VETRO_ANCHORS: readonly HemiEarnVetroAnchor[] = [
  {
    gateway: zeroAddress,
    peggedToken: VETBTC_PEGGED_ADDRESS,
    shareOft: zeroAddress,
    stakingVault: zeroAddress,
  },
] as const

const findAnchor = function (shareOft: Address): HemiEarnVetroAnchor {
  const entry = HEMI_EARN_VETRO_ANCHORS.find(a =>
    isAddressEqual(a.shareOft, shareOft),
  )
  if (!entry) {
    throw new Error(`Share OFT not registered in Hemi Earn Vetro: ${shareOft}`)
  }
  return entry
}

// Looks up the Ethereum StakingVault for a Hemi-side share OFT. Throws when
// the share is not registered so callers fail loudly instead of reading from
// `zeroAddress`.
export const getStakingVaultForShare = (shareOft: Address): Address =>
  findAnchor(shareOft).stakingVault

// Looks up the Ethereum Gateway for a Hemi-side share OFT.
export const getGatewayForShare = (shareOft: Address): Address =>
  findAnchor(shareOft).gateway

// Looks up the pegged token (e.g. vetBTC) for a Hemi-side share OFT. The
// pegged token is what the StakingVault.asset() returns; use it for pricing
// and decimal-formatting share balances on the portal side.
export const getPeggedTokenForShare = (shareOft: Address): Address =>
  findAnchor(shareOft).peggedToken
