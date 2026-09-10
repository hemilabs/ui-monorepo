import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import {
  assert,
  beforeEach,
  clearStore,
  describe,
  newMockEvent,
  test,
} from 'matchstick-as/assembly/index'

import {
  Deposit as DepositEvent,
  Lock as LockEvent,
  Withdraw as WithdrawEvent,
} from '../../generated/VeHemi/VeHemi'
import {
  handleDepositEvent,
  handleNewLock,
  handleWithdraw,
} from '../../src/mappings/ve-hemi'

const owner = Address.fromString('0x0000000000000000000000000000000000000a11')

const startA = BigInt.fromI32(1700000000)
const requestedA = BigInt.fromI32(31557600)
const unlockA = BigInt.fromI32(1731460320)
const effectiveA = unlockA.minus(startA)

const startB = BigInt.fromI32(1700500000)
const requestedB = BigInt.fromI32(10519200)
const unlockB = BigInt.fromI32(1710947880)
const effectiveB = unlockB.minus(startB)

function createLockEvent(
  tokenId: i32,
  start: BigInt,
  lockTime: BigInt,
): LockEvent {
  const event = changetype<LockEvent>(newMockEvent())
  event.parameters = new Array<ethereum.EventParam>()
  event.parameters.push(
    new ethereum.EventParam('provider', ethereum.Value.fromAddress(owner)),
  )
  event.parameters.push(
    new ethereum.EventParam('account', ethereum.Value.fromAddress(owner)),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'tokenId',
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(tokenId)),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'amount',
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1000)),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam('start', ethereum.Value.fromUnsignedBigInt(start)),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'lockTime',
      ethereum.Value.fromUnsignedBigInt(lockTime),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'extraData',
      ethereum.Value.fromUnsignedBigInt(BigInt.zero()),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam('transferable', ethereum.Value.fromBoolean(false)),
  )
  event.parameters.push(
    new ethereum.EventParam('forfeitable', ethereum.Value.fromBoolean(false)),
  )
  return event
}

function createDepositEvent(
  tokenId: i32,
  amount: BigInt,
  unlockTime: BigInt,
): DepositEvent {
  const event = changetype<DepositEvent>(newMockEvent())
  event.parameters = new Array<ethereum.EventParam>()
  event.parameters.push(
    new ethereum.EventParam('provider', ethereum.Value.fromAddress(owner)),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'tokenId',
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(tokenId)),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'amount',
      ethereum.Value.fromUnsignedBigInt(amount),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'lockTime',
      ethereum.Value.fromUnsignedBigInt(unlockTime),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'timestamp',
      ethereum.Value.fromUnsignedBigInt(startA),
    ),
  )
  return event
}

function createWithdrawEvent(tokenId: i32): WithdrawEvent {
  const event = changetype<WithdrawEvent>(newMockEvent())
  event.parameters = new Array<ethereum.EventParam>()
  event.parameters.push(
    new ethereum.EventParam('provider', ethereum.Value.fromAddress(owner)),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'tokenId',
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(tokenId)),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'amount',
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1000)),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'timestamp',
      ethereum.Value.fromUnsignedBigInt(startA),
    ),
  )
  return event
}

describe('lock statistics', () => {
  beforeEach(() => {
    clearStore()
  })

  test('the deposit that precedes a new lock is ignored', () => {
    handleDepositEvent(createDepositEvent(1, BigInt.fromI32(1000), unlockA))

    assert.notInStore('LockedPosition', '1')
    assert.notInStore('LockStats', 'singleton')

    handleNewLock(createLockEvent(1, startA, requestedA))

    assert.fieldEquals('LockStats', 'singleton', 'activeLocks', '1')
    assert.fieldEquals(
      'LockStats',
      'singleton',
      'totalLockDuration',
      effectiveA.toString(),
    )
  })

  test('a new lock rounds the unlock time down to a SIX_DAYS boundary', () => {
    handleNewLock(createLockEvent(1, startA, requestedA))

    assert.fieldEquals('LockedPosition', '1', 'unlockTime', unlockA.toString())
    // the effective lock is shorter than the duration asked for
    assert.assertTrue(effectiveA.lt(requestedA))
  })

  test('a new lock adds its effective duration to the stats', () => {
    handleNewLock(createLockEvent(1, startA, requestedA))

    assert.fieldEquals('LockStats', 'singleton', 'activeLocks', '1')
    assert.fieldEquals(
      'LockStats',
      'singleton',
      'totalLockDuration',
      effectiveA.toString(),
    )
  })

  test('several locks accumulate, so the average is the sum over the count', () => {
    handleNewLock(createLockEvent(1, startA, requestedA))
    handleNewLock(createLockEvent(2, startB, requestedB))

    assert.fieldEquals('LockStats', 'singleton', 'activeLocks', '2')
    assert.fieldEquals(
      'LockStats',
      'singleton',
      'totalLockDuration',
      effectiveA.plus(effectiveB).toString(),
    )
  })

  test('extending a lock moves the stats by the difference only', () => {
    handleNewLock(createLockEvent(1, startA, requestedA))

    const extended = BigInt.fromI32(1826133120)
    handleDepositEvent(createDepositEvent(1, BigInt.zero(), extended))

    assert.fieldEquals('LockedPosition', '1', 'unlockTime', extended.toString())
    assert.fieldEquals('LockStats', 'singleton', 'activeLocks', '1')
    assert.fieldEquals(
      'LockStats',
      'singleton',
      'totalLockDuration',
      extended.minus(startA).toString(),
    )
  })

  test('increasing the amount leaves the lock duration untouched', () => {
    handleNewLock(createLockEvent(1, startA, requestedA))

    handleDepositEvent(createDepositEvent(1, BigInt.fromI32(500), unlockA))

    assert.fieldEquals('LockedPosition', '1', 'amount', '1500')
    assert.fieldEquals(
      'LockStats',
      'singleton',
      'totalLockDuration',
      effectiveA.toString(),
    )
  })

  test('withdrawing removes only that position from the stats', () => {
    handleNewLock(createLockEvent(1, startA, requestedA))
    handleNewLock(createLockEvent(2, startB, requestedB))

    handleWithdraw(createWithdrawEvent(1))

    assert.fieldEquals('LockedPosition', '1', 'status', 'withdrawn')
    assert.fieldEquals('LockStats', 'singleton', 'activeLocks', '1')
    assert.fieldEquals(
      'LockStats',
      'singleton',
      'totalLockDuration',
      effectiveB.toString(),
    )
  })

  test('withdrawing every lock empties the stats', () => {
    handleNewLock(createLockEvent(1, startA, requestedA))
    handleWithdraw(createWithdrawEvent(1))

    assert.fieldEquals('LockStats', 'singleton', 'activeLocks', '0')
    assert.fieldEquals('LockStats', 'singleton', 'totalLockDuration', '0')
  })
})
