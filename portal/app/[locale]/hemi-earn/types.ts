import { type EvmToken } from 'types/token'
import { type Address, type Chain, type Hash } from 'viem'

import {
  type DepositOperation,
  type WithdrawOperation,
} from './pool/[shareAddress]/_types/operations'

export type MetricDataPoint = { x: number; y: number }
export type MetricPeriod = '1w' | '1m' | '3m' | '1y'
export type MetricType = 'deposits' | 'apy'

export type EarnTransactionStatusType =
  | 'PENDING'
  | 'FULFILLED'
  | 'CLAIMED'
  | 'CANCELLED'
  | 'RECOVERED'
  | 'TX_PENDING'
  | 'FAILED'

export type EarnTransactionKindType = 'DEPOSIT' | 'REDEEM'

// Mirror of the `EarnRequestRow` returned by the portal-api endpoint
// `GET /subgraphs/:chainId/earn-requests/:address` (PR #1946). BigInt values arrive as
// JSON strings; consumers parse with `BigInt(...)` for arithmetic
// (`formatUnits`) and `Number(...)` for display (`InRelativeTime`). The
// subgraph schema doesn't expose `operator` yet, so it's intentionally absent.
export type EarnTransaction = {
  amountIn: string
  amountOut: string | null
  // Approval tx hash, only available for entries surfaced from this
  // browser's local store (where `useDeposit` captures it on
  // `user-signed-approval`). Subgraph-only rows don't expose it — the
  // indexer has no way to tie an approval tx to a specific request.
  approvalTxHash?: Hash
  asset: Address
  automatic: boolean
  claimTxHash: Hash | null
  initiatedAt: string
  initiateTxHash: Hash
  kind: EarnTransactionKindType
  receiver: Address
  recoverTxHash: Hash | null
  requestId: string
  status: EarnTransactionStatusType
}

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
// `apy` is tri-state:
//   `undefined` — APY query still pending (show skeleton)
//   `null`      — APY query settled but no value for this share (error or
//                 missing in response → show '-')
//   `number`    — 7-day APY available
export type EarnPool = {
  apy: number | null | undefined
  assets: EarnAsset[]
  exposureTokens: { address: Address; chainId: EvmToken['chainId'] }[]
  peggedToken: EvmToken
  shareAddress: Address
  shareToken: EvmToken
  totalDeposits: bigint
}

// `yourDeposit` is the raw share OFT balance (denominated in
// `shareToken.decimals`); fiat conversion goes through `peggedToken` via
// `convertToAssets`.
export type EarnPosition = {
  peggedToken: EvmToken
  shareAddress: Address
  shareToken: EvmToken
  yourDeposit: bigint
}

// Local mirror of an earn operation initiated from this browser. Survives the
// route change between /hemi-earn and /hemi-earn/pool/[shareAddress] and is
// soft-deleted (flag `settled: true`) once the subgraph indexes the matching
// request — `useEarnDeliveryWatcher`'s reconcile loop flips the flag. The
// entry stays in storage so the drawer can keep enriching the subgraph row
// with locally-captured metadata that the indexer doesn't expose (e.g.
// `approvalTxHash`). TTL + per-account cap keep storage bounded.
//
// `amountIn` is a string because bigint can't be serialized to JSON (and
// therefore can't be persisted to localStorage). Same convention as
// `CommonOperation.amount` in `portal/types/tunnel.ts`. Convert with
// `BigInt(...)` only when arithmetic is needed (e.g. formatUnits).
type LocalEarnOperationBase = {
  account: Address
  amountIn: string
  approvalTxHash?: Hash
  asset: Address
  chainId: Chain['id']
  initiateTxHash?: Hash
  operator?: Address
  settled?: boolean
  shareAddress: Address
  // Unix seconds. Matches the unit of `TTL_SECONDS` in
  // `localEarnOperationsContext.tsx` — if this ever changes to ms, the GC
  // comparison there must change too.
  startedAt: number
}

export type LocalEarnDepositOperation = LocalEarnOperationBase & {
  kind: 'DEPOSIT'
  operation: DepositOperation
}

type LocalEarnWithdrawOperation = LocalEarnOperationBase & {
  kind: 'REDEEM'
  operation: WithdrawOperation
}

export type LocalEarnOperation =
  | LocalEarnDepositOperation
  | LocalEarnWithdrawOperation

export const isLocalEarnDeposit = (
  op: LocalEarnOperation,
): op is LocalEarnDepositOperation => op.kind === 'DEPOSIT'
