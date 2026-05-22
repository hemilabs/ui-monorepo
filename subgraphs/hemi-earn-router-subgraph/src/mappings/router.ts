import {
  DepositRequested as DepositRequestedEvent,
  RedeemRequested as RedeemRequestedEvent,
  RequestClaimed as RequestClaimedEvent,
  RequestFulfilled as RequestFulfilledEvent,
  RequestRecovered as RequestRecoveredEvent,
  RequestUndone as RequestUndoneEvent,
} from '../../generated/Router/Router'
import { Request } from '../../generated/schema'

export function handleDepositRequested(event: DepositRequestedEvent): void {
  const id = event.params.requestId.toString()
  const request = new Request(id)
  request.requestId = event.params.requestId
  request.kind = 'DEPOSIT'
  request.asset = event.params.asset
  request.amountIn = event.params.assets
  request.receiver = event.params.receiver
  request.automatic = event.params.automatic
  request.initiatedAt = event.block.timestamp
  request.status = 'PENDING'
  request.initiateTxHash = event.transaction.hash
  request.save()
}

export function handleRedeemRequested(event: RedeemRequestedEvent): void {
  const id = event.params.requestId.toString()
  const request = new Request(id)
  request.requestId = event.params.requestId
  request.kind = 'REDEEM'
  request.asset = event.params.asset
  request.amountIn = event.params.shares
  request.receiver = event.params.receiver
  request.automatic = event.params.automatic
  request.initiatedAt = event.block.timestamp
  request.status = 'PENDING'
  request.initiateTxHash = event.transaction.hash
  request.save()
}

export function handleRequestFulfilled(event: RequestFulfilledEvent): void {
  const request = Request.load(event.params.requestId.toString())
  if (request == null) {
    return
  }
  request.status = 'FULFILLED'
  // Actual amount the user received (shares for deposits, assets for redeems)
  request.amountOut = event.params.amountIn
  request.save()
}

export function handleRequestClaimed(event: RequestClaimedEvent): void {
  const request = Request.load(event.params.requestId.toString())
  if (request == null) {
    return
  }
  request.status = 'CLAIMED'
  request.claimTxHash = event.transaction.hash
  request.save()
}

export function handleRequestUndone(event: RequestUndoneEvent): void {
  const request = Request.load(event.params.requestId.toString())
  if (request == null) {
    return
  }
  request.status = 'UNDONE'
  // Amount of assets the user will receive back. This should match the
  // request's amountIn, but the contract overwrites this field, so we
  // capture whatever value actually returns.
  request.amountOut = event.params.amountIn
  request.save()
}

export function handleRequestRecovered(event: RequestRecoveredEvent): void {
  const request = Request.load(event.params.requestId.toString())
  if (request == null) {
    return
  }
  request.status = 'RECOVERED'
  request.recoverTxHash = event.transaction.hash
  request.save()
}
