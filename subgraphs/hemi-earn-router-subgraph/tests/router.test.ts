import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts'
import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index'

import {
  handleDepositRequested,
  handleRedeemRequested,
  handleRequestClaimed,
  handleRequestFulfilled,
  handleRequestRecovered,
  handleRequestUndone,
} from '../src/mappings/router'

import {
  createDepositRequestedEvent,
  createRedeemRequestedEvent,
  createRequestClaimedEvent,
  createRequestFulfilledEvent,
  createRequestRecoveredEvent,
  createRequestUndoneEvent,
} from './router-utils'

const ENTITY = 'Request'

const requestId = BigInt.fromI32(42)
const requestIdString = requestId.toString()

const asset = Address.fromString('0x1111111111111111111111111111111111111111')
const receiver = Address.fromString(
  '0x2222222222222222222222222222222222222222',
)
const assets = BigInt.fromString('1000000000000000000') // 1e18
const sharesOut = BigInt.fromString('950000000000000000') // 0.95e18
const assetsReturned = BigInt.fromString('990000000000000000') // 0.99e18 (Agent kept a fee)
const shares = BigInt.fromString('800000000000000000') // 0.8e18
const assetsOut = BigInt.fromString('790000000000000000') // 0.79e18 (Agent kept a fee)
const sharesReturned = BigInt.fromString('800000000000000000') // 0.8e18
const initiatedAt = BigInt.fromI32(1769731200) // 2026-01-30 00:00:00 UTC

const depositTxHash = Bytes.fromHexString(
  '0xaa00000000000000000000000000000000000000000000000000000000000001',
) as Bytes
const fulfillTxHash = Bytes.fromHexString(
  '0xaa00000000000000000000000000000000000000000000000000000000000002',
) as Bytes
const claimTxHash = Bytes.fromHexString(
  '0xaa00000000000000000000000000000000000000000000000000000000000003',
) as Bytes
const undoTxHash = Bytes.fromHexString(
  '0xaa00000000000000000000000000000000000000000000000000000000000004',
) as Bytes
const recoverTxHash = Bytes.fromHexString(
  '0xaa00000000000000000000000000000000000000000000000000000000000005',
) as Bytes
const redeemTxHash = Bytes.fromHexString(
  '0xaa00000000000000000000000000000000000000000000000000000000000006',
) as Bytes

function emitDeposit(automatic: boolean): void {
  handleDepositRequested(
    createDepositRequestedEvent(
      requestId,
      asset,
      assets,
      receiver,
      automatic,
      depositTxHash,
      initiatedAt,
    ),
  )
}

function emitRedeem(automatic: boolean): void {
  handleRedeemRequested(
    createRedeemRequestedEvent(
      requestId,
      asset,
      shares,
      receiver,
      automatic,
      redeemTxHash,
      initiatedAt,
    ),
  )
}

describe('Router subgraph', function () {
  beforeEach(function () {
    clearStore()
  })

  test('DepositRequested creates a Request with kind=DEPOSIT and status=PENDING', function () {
    emitDeposit(false)

    assert.entityCount(ENTITY, 1)
    assert.fieldEquals(ENTITY, requestIdString, 'kind', 'DEPOSIT')
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'requestId',
      requestId.toString(),
    )
    assert.fieldEquals(ENTITY, requestIdString, 'asset', asset.toHexString())
    assert.fieldEquals(ENTITY, requestIdString, 'amountIn', assets.toString())
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'receiver',
      receiver.toHexString(),
    )
    assert.fieldEquals(ENTITY, requestIdString, 'automatic', 'false')
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'initiatedAt',
      initiatedAt.toString(),
    )
    assert.fieldEquals(ENTITY, requestIdString, 'status', 'PENDING')
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'initiateTxHash',
      depositTxHash.toHexString(),
    )
  })

  test('Happy path: fulfilled records amountOut and claimed transitions to CLAIMED with claimTxHash', function () {
    emitDeposit(false)

    handleRequestFulfilled(
      createRequestFulfilledEvent(requestId, sharesOut, fulfillTxHash),
    )
    assert.entityCount(ENTITY, 1)
    assert.fieldEquals(ENTITY, requestIdString, 'status', 'FULFILLED')
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'amountOut',
      sharesOut.toString(),
    )

    handleRequestClaimed(
      createRequestClaimedEvent(requestId, receiver, claimTxHash),
    )
    assert.entityCount(ENTITY, 1)
    assert.fieldEquals(ENTITY, requestIdString, 'status', 'CLAIMED')
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'claimTxHash',
      claimTxHash.toHexString(),
    )
    // initiateTxHash and amountOut are preserved across transitions
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'initiateTxHash',
      depositTxHash.toHexString(),
    )
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'amountOut',
      sharesOut.toString(),
    )
  })

  test('Undo path: undone records returned amountOut and recovered transitions to RECOVERED with recoverTxHash', function () {
    emitDeposit(false)

    handleRequestUndone(
      createRequestUndoneEvent(requestId, assetsReturned, undoTxHash),
    )
    assert.entityCount(ENTITY, 1)
    assert.fieldEquals(ENTITY, requestIdString, 'status', 'UNDONE')
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'amountOut',
      assetsReturned.toString(),
    )

    handleRequestRecovered(
      createRequestRecoveredEvent(requestId, receiver, recoverTxHash),
    )
    assert.entityCount(ENTITY, 1)
    assert.fieldEquals(ENTITY, requestIdString, 'status', 'RECOVERED')
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'recoverTxHash',
      recoverTxHash.toHexString(),
    )
  })

  test('Shared events for an unknown requestId are no-ops', function () {
    const unknownId = BigInt.fromI32(9999)

    handleRequestFulfilled(
      createRequestFulfilledEvent(unknownId, sharesOut, fulfillTxHash),
    )
    handleRequestClaimed(
      createRequestClaimedEvent(unknownId, receiver, claimTxHash),
    )
    handleRequestUndone(
      createRequestUndoneEvent(unknownId, assetsReturned, undoTxHash),
    )
    handleRequestRecovered(
      createRequestRecoveredEvent(unknownId, receiver, recoverTxHash),
    )

    assert.entityCount(ENTITY, 0)
  })

  test('RedeemRequested creates a Request with kind=REDEEM and status=PENDING', function () {
    emitRedeem(false)

    assert.entityCount(ENTITY, 1)
    assert.fieldEquals(ENTITY, requestIdString, 'kind', 'REDEEM')
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'requestId',
      requestId.toString(),
    )
    assert.fieldEquals(ENTITY, requestIdString, 'asset', asset.toHexString())
    assert.fieldEquals(ENTITY, requestIdString, 'amountIn', shares.toString())
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'receiver',
      receiver.toHexString(),
    )
    assert.fieldEquals(ENTITY, requestIdString, 'automatic', 'false')
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'initiatedAt',
      initiatedAt.toString(),
    )
    assert.fieldEquals(ENTITY, requestIdString, 'status', 'PENDING')
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'initiateTxHash',
      redeemTxHash.toHexString(),
    )
  })

  test('Redeem happy path: fulfilled records asset amountOut and claimed transitions to CLAIMED', function () {
    emitRedeem(false)

    handleRequestFulfilled(
      createRequestFulfilledEvent(requestId, assetsOut, fulfillTxHash),
    )
    assert.entityCount(ENTITY, 1)
    assert.fieldEquals(ENTITY, requestIdString, 'status', 'FULFILLED')
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'amountOut',
      assetsOut.toString(),
    )

    handleRequestClaimed(
      createRequestClaimedEvent(requestId, receiver, claimTxHash),
    )
    assert.entityCount(ENTITY, 1)
    assert.fieldEquals(ENTITY, requestIdString, 'status', 'CLAIMED')
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'claimTxHash',
      claimTxHash.toHexString(),
    )
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'initiateTxHash',
      redeemTxHash.toHexString(),
    )
  })

  test('Redeem undo path: undone records returned shares and recovered transitions to RECOVERED', function () {
    emitRedeem(false)

    handleRequestUndone(
      createRequestUndoneEvent(requestId, sharesReturned, undoTxHash),
    )
    assert.entityCount(ENTITY, 1)
    assert.fieldEquals(ENTITY, requestIdString, 'status', 'UNDONE')
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'amountOut',
      sharesReturned.toString(),
    )

    handleRequestRecovered(
      createRequestRecoveredEvent(requestId, receiver, recoverTxHash),
    )
    assert.entityCount(ENTITY, 1)
    assert.fieldEquals(ENTITY, requestIdString, 'status', 'RECOVERED')
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'recoverTxHash',
      recoverTxHash.toHexString(),
    )
  })

  test('automatic = true follows the same state machine', function () {
    emitDeposit(true)
    assert.fieldEquals(ENTITY, requestIdString, 'automatic', 'true')

    handleRequestFulfilled(
      createRequestFulfilledEvent(requestId, sharesOut, fulfillTxHash),
    )
    handleRequestClaimed(
      createRequestClaimedEvent(requestId, receiver, claimTxHash),
    )

    assert.entityCount(ENTITY, 1)
    assert.fieldEquals(ENTITY, requestIdString, 'status', 'CLAIMED')
    assert.fieldEquals(
      ENTITY,
      requestIdString,
      'claimTxHash',
      claimTxHash.toHexString(),
    )
  })
})
