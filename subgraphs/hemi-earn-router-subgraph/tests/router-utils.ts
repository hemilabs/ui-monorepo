import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'
import { newMockEvent } from 'matchstick-as'

import {
  CancellationRequested,
  DepositRequested,
  RedeemRequested,
  RequestCancelled,
  RequestClaimed,
  RequestFulfilled,
  RequestRecovered,
} from '../generated/Router/Router'

function setTxHash(event: ethereum.Event, txHash: Bytes): void {
  event.transaction.hash = txHash
}

function setBlockTimestamp(event: ethereum.Event, timestamp: BigInt): void {
  event.block.timestamp = timestamp
}

export function createDepositRequestedEvent(
  requestId: BigInt,
  asset: Address,
  assets: BigInt,
  amountOutMin: BigInt,
  receiver: Address,
  automatic: boolean,
  txHash: Bytes,
  timestamp: BigInt,
): DepositRequested {
  const event = changetype<DepositRequested>(newMockEvent())
  event.parameters = new Array<ethereum.EventParam>()
  event.parameters.push(
    new ethereum.EventParam(
      'requestId',
      ethereum.Value.fromUnsignedBigInt(requestId),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam('asset', ethereum.Value.fromAddress(asset)),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'assets',
      ethereum.Value.fromUnsignedBigInt(assets),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'amountOutMin',
      ethereum.Value.fromUnsignedBigInt(amountOutMin),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam('receiver', ethereum.Value.fromAddress(receiver)),
  )
  event.parameters.push(
    new ethereum.EventParam('automatic', ethereum.Value.fromBoolean(automatic)),
  )
  setTxHash(event, txHash)
  setBlockTimestamp(event, timestamp)
  return event
}

export function createRedeemRequestedEvent(
  requestId: BigInt,
  asset: Address,
  shares: BigInt,
  amountOutMin: BigInt,
  receiver: Address,
  automatic: boolean,
  txHash: Bytes,
  timestamp: BigInt,
): RedeemRequested {
  const event = changetype<RedeemRequested>(newMockEvent())
  event.parameters = new Array<ethereum.EventParam>()
  event.parameters.push(
    new ethereum.EventParam(
      'requestId',
      ethereum.Value.fromUnsignedBigInt(requestId),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam('asset', ethereum.Value.fromAddress(asset)),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'shares',
      ethereum.Value.fromUnsignedBigInt(shares),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'amountOutMin',
      ethereum.Value.fromUnsignedBigInt(amountOutMin),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam('receiver', ethereum.Value.fromAddress(receiver)),
  )
  event.parameters.push(
    new ethereum.EventParam('automatic', ethereum.Value.fromBoolean(automatic)),
  )
  setTxHash(event, txHash)
  setBlockTimestamp(event, timestamp)
  return event
}

export function createRequestFulfilledEvent(
  requestId: BigInt,
  amount: BigInt,
  txHash: Bytes,
): RequestFulfilled {
  const event = changetype<RequestFulfilled>(newMockEvent())
  event.parameters = new Array<ethereum.EventParam>()
  event.parameters.push(
    new ethereum.EventParam(
      'requestId',
      ethereum.Value.fromUnsignedBigInt(requestId),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'amount',
      ethereum.Value.fromUnsignedBigInt(amount),
    ),
  )
  setTxHash(event, txHash)
  return event
}

export function createRequestClaimedEvent(
  requestId: BigInt,
  txHash: Bytes,
): RequestClaimed {
  const event = changetype<RequestClaimed>(newMockEvent())
  event.parameters = new Array<ethereum.EventParam>()
  event.parameters.push(
    new ethereum.EventParam(
      'requestId',
      ethereum.Value.fromUnsignedBigInt(requestId),
    ),
  )
  setTxHash(event, txHash)
  return event
}

export function createRequestCancelledEvent(
  requestId: BigInt,
  amount: BigInt,
  txHash: Bytes,
): RequestCancelled {
  const event = changetype<RequestCancelled>(newMockEvent())
  event.parameters = new Array<ethereum.EventParam>()
  event.parameters.push(
    new ethereum.EventParam(
      'requestId',
      ethereum.Value.fromUnsignedBigInt(requestId),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'amount',
      ethereum.Value.fromUnsignedBigInt(amount),
    ),
  )
  setTxHash(event, txHash)
  return event
}

export function createRequestRecoveredEvent(
  requestId: BigInt,
  txHash: Bytes,
): RequestRecovered {
  const event = changetype<RequestRecovered>(newMockEvent())
  event.parameters = new Array<ethereum.EventParam>()
  event.parameters.push(
    new ethereum.EventParam(
      'requestId',
      ethereum.Value.fromUnsignedBigInt(requestId),
    ),
  )
  setTxHash(event, txHash)
  return event
}

export function createCancellationRequestedEvent(
  requestId: BigInt,
  txHash: Bytes,
  timestamp: BigInt,
): CancellationRequested {
  const event = changetype<CancellationRequested>(newMockEvent())
  event.parameters = new Array<ethereum.EventParam>()
  event.parameters.push(
    new ethereum.EventParam(
      'requestId',
      ethereum.Value.fromUnsignedBigInt(requestId),
    ),
  )
  setTxHash(event, txHash)
  setBlockTimestamp(event, timestamp)
  return event
}
