import { type Address, type Hash } from 'viem'

// Subgraph-side status from the Envio indexer (Router-authoritative).
type SubgraphRequestStatus =
  | 'PENDING'
  | 'FULFILLED'
  | 'FINALIZED'
  | 'CANCELLED'
  | 'RECOVERED'

// Portal-facing status. `'FAILED'` is synthetic — derived at the helper
// boundary from the subgraph's `failed` flag (the indexer keeps `status`
// Router-authoritative).
export type EarnRequestStatus = SubgraphRequestStatus | 'FAILED'

// Fields that flow through the boundary unchanged. Keeping the shared
// shape in one place so the two types below stay in sync when the
// subgraph schema evolves.
type EarnRequestCommonFields = {
  amountIn: string
  amountOut: string | null
  // True once a cancellation has been requested — either the user signing
  // `Router.cancel` or an Agent-side cancellation-intent event. Distinct
  // from `failed` (an Agent-side failure), so the portal can brand a
  // deliberate cancel apart from a real failure on a CANCELLED redeem.
  cancellationRequested: boolean
  claimableAt: string | null
  failed: boolean
  failureReason: string | null
  kind: 'DEPOSIT' | 'REDEEM'
  requestedAt: string
  requestId: string
}

// Raw `Request` entity from the Envio `hemi-earn-requests-subgraph`. The
// indexer lowercases addresses/hashes and emits BigInts as strings;
// `automatic` is nullable because the entity can be created from an
// Agent-side event before the Router fires its `*Requested` event.
export type SubgraphRequest = EarnRequestCommonFields & {
  asset: string
  automatic: boolean | null
  claimTxHash: string | null
  receiver: string
  recoverTxHash: string | null
  requestTxHash: string
  status: SubgraphRequestStatus
}

// One Hemi Earn cross-chain request, as returned by
// `GET /subgraphs/:chainId/earn-requests/:address`. Shape mirrors the
// portal's `EarnTransaction` type (minus the localStorage-only fields).
// BigInt values arrive as strings. `failed` is the raw Agent-side flag and is
// NOT redundant with `status === 'FAILED'`: a terminal status (CANCELLED /
// RECOVERED) can carry `failed: true`, while the synthetic FAILED status only
// applies to a still-PENDING request. `failureReason` carries the raw revert
// reason for any future UI that surfaces it.
export type EarnRequestRow = EarnRequestCommonFields & {
  asset: Address
  automatic: boolean
  claimTxHash: Hash | null
  receiver: Address
  recoverTxHash: Hash | null
  requestTxHash: Hash
  status: EarnRequestStatus
}
