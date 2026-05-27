import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'

import {
  DepositRequested as DepositRequestedEvent,
  RedeemRequested as RedeemRequestedEvent,
  RequestCancelled as RequestCancelledEvent,
  RequestClaimed as RequestClaimedEvent,
  RequestFulfilled as RequestFulfilledEvent,
  RequestRecovered as RequestRecoveredEvent,
} from '../../generated/Router/Router'
import { Request } from '../../generated/schema'

// Lifecycle handlers (Fulfilled / Claimed / Cancelled / Recovered) don't
// know the request `kind` — that information only lives in the originating
// Deposit/Redeem event. When those handlers have to create a placeholder
// (see `loadOrInitRequest` below), they pass this value as a best-guess
// sentinel. In the anvil mock the Deposit/Redeem event always arrives later
// in the same tx and overwrites it; the bias only surfaces if the subgraph
// is (re)indexed past the creation block and the placeholder persists.
const FALLBACK_KIND = 'DEPOSIT'

// Loads the Request entity, or creates one with sentinel field values when
// the originating Deposit/Redeem hasn't been observed yet. This happens:
//   1. When graph-node processes events in an order where a lifecycle event
//      (Fulfilled / Claimed / Cancelled / Recovered) precedes the request-
//      creation event in the same tx — the local anvil mock collapses the
//      cross-chain hop into one transaction and emits RequestFulfilled
//      inside `requestDeposit`, ahead of the final `emit DepositRequested`;
//      production cross-chain timing naturally separates these into
//      different blocks.
//   2. When the subgraph is (re)indexed with `startBlock` past a request's
//      creation block, so the creation event was never observed locally.
// Sentinels are placeholders for the required (non-null) fields. When (and
// if) the corresponding Deposit/Redeem arrives later, it overwrites them
// with the real values; lifecycle handlers overwrite `status`/`amountOut`/
// `*TxHash`. Address-shaped fields use the 20-byte zero address so
// downstream consumers (e.g. portal calls to `getAddress(asset)`) keep
// working on placeholder rows instead of choking on `0x`. `kind` is taken
// from the caller — Deposit/Redeem pass their own kind; lifecycle handlers
// pass `FALLBACK_KIND` since they have no way to know.
function loadOrInitRequest(
  id: string,
  kind: string,
  event: ethereum.Event,
): Request {
  let request = Request.load(id)
  if (request == null) {
    request = new Request(id)
    request.requestId = BigInt.fromString(id)
    request.kind = kind
    request.asset = Address.zero()
    request.amountIn = BigInt.zero()
    request.receiver = Address.zero()
    request.automatic = false
    request.initiatedAt = event.block.timestamp
    request.initiateTxHash = event.transaction.hash
    request.status = 'PENDING'
  }
  return request
}

export function handleDepositRequested(event: DepositRequestedEvent): void {
  const request = loadOrInitRequest(
    event.params.requestId.toString(),
    'DEPOSIT',
    event,
  )
  // Populate request-time fields. `status` is intentionally NOT reassigned
  // when the entity pre-exists — a lifecycle handler (Fulfilled / Claimed /
  // Cancelled / Recovered) already wrote the current status and resetting
  // to PENDING here would clobber it. `loadOrInitRequest` seeds PENDING for
  // the fresh-entity case.
  request.requestId = event.params.requestId
  request.kind = 'DEPOSIT'
  request.asset = event.params.asset
  request.amountIn = event.params.assets
  request.receiver = event.params.receiver
  request.automatic = event.params.automatic
  request.initiatedAt = event.block.timestamp
  request.initiateTxHash = event.transaction.hash
  request.save()
}

export function handleRedeemRequested(event: RedeemRequestedEvent): void {
  const request = loadOrInitRequest(
    event.params.requestId.toString(),
    'REDEEM',
    event,
  )
  request.requestId = event.params.requestId
  request.kind = 'REDEEM'
  request.asset = event.params.asset
  request.amountIn = event.params.shares
  request.receiver = event.params.receiver
  request.automatic = event.params.automatic
  request.initiatedAt = event.block.timestamp
  request.initiateTxHash = event.transaction.hash
  request.save()
}

export function handleRequestFulfilled(event: RequestFulfilledEvent): void {
  const request = loadOrInitRequest(
    event.params.requestId.toString(),
    FALLBACK_KIND,
    event,
  )
  request.status = 'FULFILLED'
  // Actual amount the user received (shares for deposits, assets for redeems)
  request.amountOut = event.params.amountIn
  request.save()
}

export function handleRequestClaimed(event: RequestClaimedEvent): void {
  const request = loadOrInitRequest(
    event.params.requestId.toString(),
    FALLBACK_KIND,
    event,
  )
  request.status = 'CLAIMED'
  request.claimTxHash = event.transaction.hash
  request.save()
}

export function handleRequestCancelled(event: RequestCancelledEvent): void {
  const request = loadOrInitRequest(
    event.params.requestId.toString(),
    FALLBACK_KIND,
    event,
  )
  request.status = 'CANCELLED'
  // Amount of assets the user will receive back. This should match the
  // request's amountIn, but the contract overwrites this field, so we
  // capture whatever value actually returns.
  request.amountOut = event.params.amountIn
  request.save()
}

export function handleRequestRecovered(event: RequestRecoveredEvent): void {
  const request = loadOrInitRequest(
    event.params.requestId.toString(),
    FALLBACK_KIND,
    event,
  )
  request.status = 'RECOVERED'
  request.recoverTxHash = event.transaction.hash
  request.save()
}
