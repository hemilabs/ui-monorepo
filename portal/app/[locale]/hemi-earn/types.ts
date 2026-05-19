import { type EvmToken } from 'types/token'
import { type Address } from 'viem'

export type MetricDataPoint = { x: number; y: number }
export type MetricPeriod = '1w' | '1m' | '3m' | '1y'
export type MetricType = 'deposits' | 'apy'

// One deposit option that settles into a share OFT.
export type EarnAsset = {
  address: Address
  token: EvmToken
}

// A pool, in this codebase, is one Vetro share vault on the Ethereum side
// (e.g. sVUSD) plus every deposit asset registered on the Hemi Router that
// settles into it. APY and TVL live at the share level — the per-asset rows
// of the old ERC-4626 model are now collapsed into `assets`.
//
// `totalDeposits` is `StakingVault.totalAssets()`, expressed in the pegged
// token's units (vBTC, vUSD — that's what the vault's `asset()` returns).
// Pair it with `peggedToken` for formatting and pricing; never with
// `shareToken`, since the share OFT has no public price feed.
export type EarnPool = {
  apy: { base: number; incentivized: number; total: number }
  assets: EarnAsset[]
  exposureTokens: { address: Address; chainId: EvmToken['chainId'] }[]
  peggedToken: EvmToken
  shareAddress: Address
  shareToken: EvmToken
  totalDeposits: bigint
}

// One row in the My Positions table. `yourDeposit` is the raw share OFT
// balance (denominated in `shareToken.decimals`); fiat conversion goes
// through `peggedToken` via `convertToAssets` (see `ShareValueDisplay`).
export type EarnPosition = {
  apy: { base: number; incentivized: number; total: number }
  peggedToken: EvmToken
  shareAddress: Address
  shareToken: EvmToken
  yourDeposit: bigint
}
