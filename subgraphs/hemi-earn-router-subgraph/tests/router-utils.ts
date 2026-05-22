import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'
import { newMockEvent } from 'matchstick-as'

import {
  DepositRequested,
  RedeemRequested,
  RequestClaimed,
  RequestFulfilled,
  RequestRecovered,
  RequestUndone,
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
  amountIn: BigInt,
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
      'amountIn',
      ethereum.Value.fromUnsignedBigInt(amountIn),
    ),
  )
  setTxHash(event, txHash)
  return event
}

export function createRequestClaimedEvent(
  requestId: BigInt,
  receiver: Address,
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
  event.parameters.push(
    new ethereum.EventParam('receiver', ethereum.Value.fromAddress(receiver)),
  )
  setTxHash(event, txHash)
  return event
}

export function createRequestUndoneEvent(
  requestId: BigInt,
  amountIn: BigInt,
  txHash: Bytes,
): RequestUndone {
  const event = changetype<RequestUndone>(newMockEvent())
  event.parameters = new Array<ethereum.EventParam>()
  event.parameters.push(
    new ethereum.EventParam(
      'requestId',
      ethereum.Value.fromUnsignedBigInt(requestId),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'amountIn',
      ethereum.Value.fromUnsignedBigInt(amountIn),
    ),
  )
  setTxHash(event, txHash)
  return event
}

export function createRequestRecoveredEvent(
  requestId: BigInt,
  receiver: Address,
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
  event.parameters.push(
    new ethereum.EventParam('receiver', ethereum.Value.fromAddress(receiver)),
  )
  setTxHash(event, txHash)
  return event
}
