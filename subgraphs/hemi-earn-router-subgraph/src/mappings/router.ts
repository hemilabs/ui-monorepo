import {
  DepositRequested as DepositRequestedEvent,
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

export function handleRequestFulfilled(event: RequestFulfilledEvent): void {
  const request = Request.load(event.params.requestId.toString())
  if (request == null) {
    return
  }
  request.status = 'FULFILLED'
  // This are the actual shares the user received
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
  // amount of assets that will be returned to the user,
  // I think it wil match what was the amountIn of the request, but the contract
  // does updates it in its code, so let's match for the case the values do differ
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
