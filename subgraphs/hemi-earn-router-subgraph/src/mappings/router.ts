import { BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'

import {
  DepositRequested as DepositRequestedEvent,
  RedeemRequested as RedeemRequestedEvent,
  RequestCancelled as RequestCancelledEvent,
  RequestClaimed as RequestClaimedEvent,
  RequestFulfilled as RequestFulfilledEvent,
  RequestRecovered as RequestRecoveredEvent,
} from '../../generated/Router/Router'
import { Request } from '../../generated/schema'

// Loads the Request entity, or creates one with sentinel field values when a
// lifecycle event (Fulfilled / Claimed / Cancelled / Recovered) arrives
// BEFORE the originating DepositRequested / RedeemRequested. This happens:
//   1. When graph-node processes events in an order where the lifecycle event
//      precedes the request-creation event in the same tx (e.g. the local
//      anvil mock that collapses the cross-chain hop into one transaction
//      emits RequestFulfilled inside the requestDeposit call, ahead of the
//      final `emit DepositRequested(...)`); production cross-chain timing
//      naturally separates these into different blocks.
//   2. When the subgraph is (re)indexed with `startBlock` past a request's
//      creation block, so DepositRequested was never observed locally.
// Sentinels are placeholders for the required (non-null) fields. When (and
// if) the corresponding DepositRequested / RedeemRequested arrives later, it
// overwrites them with the real values — but does NOT touch `status`, which
// is owned by the lifecycle handlers.
function loadOrInitRequest(
  id: string,
  requestId: BigInt,
  event: ethereum.Event,
): Request {
  let request = Request.load(id)
  if (request == null) {
    request = new Request(id)
    request.requestId = requestId
    // Sentinels for required fields — overwritten by Deposit/Redeem when the
    // request-creation event arrives (later in same tx, or never if missed).
    request.kind = 'DEPOSIT'
    request.asset = Bytes.empty()
    request.amountIn = BigInt.zero()
    request.receiver = Bytes.empty()
    request.automatic = false
    request.initiatedAt = event.block.timestamp
    request.initiateTxHash = event.transaction.hash
    request.status = 'PENDING'
  }
  return request
}

export function handleDepositRequested(event: DepositRequestedEvent): void {
  const id = event.params.requestId.toString()
  let request = Request.load(id)
  if (request == null) {
    request = new Request(id)
    request.status = 'PENDING'
  }
  // Populate request-time fields. `status` is intentionally NOT reassigned
  // when the entity pre-exists — a lifecycle handler (Fulfilled / Claimed /
  // Cancelled / Recovered) already wrote the current status and resetting to
  // PENDING here would clobber it. The `new Request(...)` branch above seeds
  // PENDING for the fresh-entity case.
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
  const id = event.params.requestId.toString()
  let request = Request.load(id)
  if (request == null) {
    request = new Request(id)
    request.status = 'PENDING'
  }
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
    event.params.requestId,
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
    event.params.requestId,
    event,
  )
  request.status = 'CLAIMED'
  request.claimTxHash = event.transaction.hash
  request.save()
}

export function handleRequestCancelled(event: RequestCancelledEvent): void {
  const request = loadOrInitRequest(
    event.params.requestId.toString(),
    event.params.requestId,
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
    event.params.requestId,
    event,
  )
  request.status = 'RECOVERED'
  request.recoverTxHash = event.transaction.hash
  request.save()
}
