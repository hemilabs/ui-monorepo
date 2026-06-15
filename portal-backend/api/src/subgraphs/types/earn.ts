import { type Address, type Hash } from 'viem'

// Portal-facing status. `'FAILED'` is synthetic — derived at the helper
// boundary from the subgraph's `failed` flag (the indexer keeps `status`
// Router-authoritative).
export type EarnRequestStatus =
  | 'PENDING'
  | 'FULFILLED'
  | 'FINALIZED'
  | 'CANCELLED'
  | 'RECOVERED'
  | 'FAILED'

// One Hemi Earn cross-chain request, as returned by
// `GET /subgraphs/:chainId/earn-requests/:address`. Shape mirrors the
// portal's `EarnTransaction` type (minus the localStorage-only fields).
// BigInt values arrive as strings. `failed` is redundant with
// `status === 'FAILED'` but exposed for debug; `failureReason` carries the
// raw revert reason for any future UI that surfaces it.
export type EarnRequestRow = {
  amountIn: string
  amountOut: string | null
  asset: Address
  automatic: boolean
  claimableAt: string | null
  claimTxHash: Hash | null
  failed: boolean
  failureReason: string | null
  kind: 'DEPOSIT' | 'REDEEM'
  receiver: Address
  recoverTxHash: Hash | null
  requestedAt: string
  requestId: string
  requestTxHash: Hash
  status: EarnRequestStatus
}
