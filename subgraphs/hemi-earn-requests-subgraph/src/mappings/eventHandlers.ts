/**
 * Handlers for the Hemi Earn cross-chain request flow.
 *
 * Every event carries `requestId`, which is used as the Request entity id. Each
 * handler loads (or initializes) that entity, merges in its fields, and writes
 * it back — so the same Request is built up as a "partial view" no matter which
 * chain's event arrives first (Router on Hemi, Agent on Ethereum).
 */
import { indexer } from 'envio'
import type { EvmOnEventContext, Request } from 'envio'

const lc = (address: string): string => address.toLowerCase()

// A fully-defaulted Request, so partial-view creation is identical from either
// chain. Optional schema fields default to `undefined`; required fields get a
// concrete default.
const baseRequest = (id: string, requestId: bigint): Request => ({
  amountIn: undefined,
  amountOut: undefined,
  amountOutMin: undefined,
  asset: undefined,
  automatic: undefined,
  cancellationRequested: false,
  cancellationRequestedAt: undefined,
  cancelledAmount: undefined,
  claimableAt: undefined,
  claimTxHash: undefined,
  failed: false,
  failureReason: undefined,
  finalizedAt: undefined,
  fulfilledAt: undefined,
  id,
  initiator: undefined,
  kind: undefined,
  processedAt: undefined,
  processTxHash: undefined,
  receivedAt: undefined,
  receiver: undefined,
  recoverTxHash: undefined,
  requestedAt: undefined,
  requestId,
  requestTxHash: undefined,
  retryCount: 0,
  stakedAmount: undefined,
  status: 'PENDING',
})

// Status ranking. Terminal states share rank 2 and are sticky; intermediate
// states (FULFILLED, CANCELLED) sit at rank 1 so they can transition forward
// to their respective terminals (FINALIZED via RequestClaimed, RECOVERED via
// RequestRecovered). Once a request is terminal it never changes, and status
// never regresses to a lower rank.
const STATUS_RANK: Record<Request['status'], number> = {
  CANCELLED: 1,
  FINALIZED: 2,
  FULFILLED: 1,
  PENDING: 0,
  RECOVERED: 2,
}

const applyStatus = (
  current: Request['status'],
  next: Request['status'],
): Request['status'] => {
  if (STATUS_RANK[current] >= 2) return current
  return STATUS_RANK[next] > STATUS_RANK[current] ? next : current
}

// Load the Request for `requestId` (or a fresh partial view), merge in the
// fields returned by `patch`, and write it back. Every handler is just a call
// to this — the per-handler logic lives entirely in the `patch` it returns,
// which receives the current entity so it can guard status / fill-if-missing.
const upsertRequest = async function ({
  context,
  patch,
  requestId,
}: {
  context: EvmOnEventContext
  patch: (existing: Request) => Partial<Request>
  requestId: bigint
}): Promise<void> {
  const id = requestId.toString()
  const existing = (await context.Request.get(id)) ?? baseRequest(id, requestId)
  context.Request.set({ ...existing, ...patch(existing) })
}

// ---------------------------------------------------------------------------
// Router (Hemi) — request creation and lifecycle.
// ---------------------------------------------------------------------------

indexer.onEvent(
  { contract: 'Router', event: 'DepositRequested' },
  async ({ context, event }) =>
    upsertRequest({
      context,
      patch: existing => ({
        amountIn: event.params.assets, // deposit input
        amountOutMin: event.params.amountOutMin,
        asset: lc(event.params.asset),
        automatic: event.params.automatic,
        initiator: event.transaction.from
          ? lc(event.transaction.from)
          : undefined,
        kind: 'DEPOSIT',
        receiver: lc(event.params.receiver),
        requestedAt: BigInt(event.block.timestamp),
        requestTxHash: event.transaction.hash,
        status: applyStatus(existing.status, 'PENDING'),
      }),
      requestId: event.params.requestId,
    }),
)

indexer.onEvent(
  { contract: 'Router', event: 'RedeemRequested' },
  async ({ context, event }) =>
    upsertRequest({
      context,
      patch: existing => ({
        amountIn: event.params.shares, // redeem input
        amountOutMin: event.params.amountOutMin,
        asset: lc(event.params.asset),
        automatic: event.params.automatic,
        initiator: event.transaction.from
          ? lc(event.transaction.from)
          : undefined,
        kind: 'REDEEM',
        receiver: lc(event.params.receiver),
        requestedAt: BigInt(event.block.timestamp),
        requestTxHash: event.transaction.hash,
        status: applyStatus(existing.status, 'PENDING'),
      }),
      requestId: event.params.requestId,
    }),
)

// Status-advancing handlers only write their milestone fields when the
// transition is actually taken — applyStatus may reject it (status never
// regresses, terminal states are sticky), and a rejected transition must not
// clobber the companion fields (timestamps, amounts, tx hashes) belonging to
// the status that already won.
indexer.onEvent(
  { contract: 'Router', event: 'RequestFulfilled' },
  async ({ context, event }) =>
    upsertRequest({
      context,
      patch: existing => {
        const status = applyStatus(existing.status, 'FULFILLED')
        if (status !== 'FULFILLED') return { status }
        return {
          amountOut: event.params.amount,
          fulfilledAt: BigInt(event.block.timestamp),
          status,
        }
      },
      requestId: event.params.requestId,
    }),
)

indexer.onEvent(
  { contract: 'Router', event: 'RequestCancelled' },
  async ({ context, event }) =>
    upsertRequest({
      context,
      patch: existing => {
        const status = applyStatus(existing.status, 'CANCELLED')
        if (status !== 'CANCELLED') return { status }
        return {
          cancelledAmount: event.params.amount,
          finalizedAt: BigInt(event.block.timestamp),
          status,
        }
      },
      requestId: event.params.requestId,
    }),
)

indexer.onEvent(
  { contract: 'Router', event: 'RequestClaimed' },
  async ({ context, event }) =>
    upsertRequest({
      context,
      patch(existing) {
        const status = applyStatus(existing.status, 'FINALIZED')
        if (status !== 'FINALIZED') return { status }
        return {
          claimTxHash: event.transaction.hash,
          finalizedAt: BigInt(event.block.timestamp),
          status,
        }
      },
      requestId: event.params.requestId,
    }),
)

indexer.onEvent(
  { contract: 'Router', event: 'RequestRecovered' },
  async ({ context, event }) =>
    upsertRequest({
      context,
      patch: existing => {
        const status = applyStatus(existing.status, 'RECOVERED')
        if (status !== 'RECOVERED') return { status }
        return {
          finalizedAt: BigInt(event.block.timestamp),
          recoverTxHash: event.transaction.hash,
          status,
        }
      },
      requestId: event.params.requestId,
    }),
)

indexer.onEvent(
  { contract: 'Router', event: 'CancellationRequested' },
  async ({ context, event }) =>
    upsertRequest({
      context,
      patch: () => ({
        cancellationRequested: true,
        cancellationRequestedAt: BigInt(event.block.timestamp),
      }),
      requestId: event.params.requestId,
    }),
)

// ---------------------------------------------------------------------------
// Agent (Ethereum) — request processing on the remote side.
// ---------------------------------------------------------------------------

indexer.onEvent(
  { contract: 'Agent', event: 'DepositRequestReceived' },
  async ({ context, event }) =>
    upsertRequest({
      context,
      patch: existing => ({
        amountIn: existing.amountIn ?? event.params.assets,
        asset: existing.asset ?? lc(event.params.asset),
        kind: existing.kind ?? 'DEPOSIT',
        receivedAt: BigInt(event.block.timestamp),
      }),
      requestId: event.params.requestId,
    }),
)

// The Router *Requested / RequestFulfilled events are authoritative for the
// amounts; the Agent only echoes them, so fill-if-missing rather than clobber
// a value the Router side may have already set (ordering is not guaranteed).
indexer.onEvent(
  { contract: 'Agent', event: 'DepositRequestProcessed' },
  async ({ context, event }) =>
    upsertRequest({
      context,
      patch: existing => ({
        amountIn: existing.amountIn ?? event.params.assets, // deposit input
        amountOut: existing.amountOut ?? event.params.shares, // deposit output (sVetToken)
        kind: existing.kind ?? 'DEPOSIT',
        processedAt: BigInt(event.block.timestamp),
        processTxHash: event.transaction.hash,
        stakedAmount: existing.stakedAmount ?? event.params.staked, // pegged staked into the vault
      }),
      requestId: event.params.requestId,
    }),
)

indexer.onEvent(
  { contract: 'Agent', event: 'RedeemRequestReceived' },
  async ({ context, event }) =>
    upsertRequest({
      context,
      patch: existing => ({
        amountIn: existing.amountIn ?? event.params.shares,
        asset: existing.asset ?? lc(event.params.asset),
        kind: existing.kind ?? 'REDEEM',
        receivedAt: BigInt(event.block.timestamp),
      }),
      requestId: event.params.requestId,
    }),
)

// Emitted by both the instant-redeem path and the cooldown claim path.
indexer.onEvent(
  { contract: 'Agent', event: 'RedeemRequestProcessed' },
  async ({ context, event }) =>
    upsertRequest({
      context,
      patch: existing => ({
        amountIn: existing.amountIn ?? event.params.shares, // redeem input
        amountOut: existing.amountOut ?? event.params.assets, // redeem output
        kind: existing.kind ?? 'REDEEM',
        processedAt: BigInt(event.block.timestamp),
        processTxHash: event.transaction.hash,
      }),
      requestId: event.params.requestId,
    }),
)

indexer.onEvent(
  { contract: 'Agent', event: 'UnstakeRequested' },
  async ({ context, event }) =>
    upsertRequest({
      context,
      patch: () => ({
        claimableAt: event.params.claimableAt,
      }),
      requestId: event.params.requestId,
    }),
)

indexer.onEvent(
  { contract: 'Agent', event: 'RequestFailed' },
  async ({ context, event }) =>
    // Agent-side failure. Status stays Router-authoritative (PENDING until the
    // Router emits the matching cancel), so we only flag the failure here.
    upsertRequest({
      context,
      patch: () => ({ failed: true, failureReason: event.params.reason }),
      requestId: event.params.requestId,
    }),
)

indexer.onEvent(
  { contract: 'Agent', event: 'RequestRetried' },
  async ({ context, event }) =>
    upsertRequest({
      context,
      patch: existing => ({
        failed: false,
        failureReason: undefined,
        retryCount: existing.retryCount + 1,
      }),
      requestId: event.params.requestId,
    }),
)

// Agent signals a cancellation back to the Router; the Router emits the
// authoritative RequestCancelled, so this only records the intent.
indexer.onEvent(
  { contract: 'Agent', event: 'RequestCancellationTriggered' },
  async ({ context, event }) =>
    upsertRequest({
      context,
      patch: () => ({
        cancellationRequested: true,
      }),
      requestId: event.params.requestId,
    }),
)
