import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'
import {
  assert,
  beforeEach,
  clearStore,
  describe,
  newMockEvent,
  test,
} from 'matchstick-as/assembly/index'

import { DepositConfirmed as DepositConfirmedEvent } from '../../generated/BitcoinTunnelManager/BitcoinTunnelManager'
import { handleDepositConfirmed } from '../../src/mappings/bitcoin-tunnel-manager'

const recipient = Address.fromString(
  '0x0000000000000000000000000000000000000b0b',
)
const vault = Address.fromString('0x000000000000000000000000000000000000beef')

const txHashHex =
  '0x1111111111111111111111111111111111111111111111111111111111111111'
const txHash = Bytes.fromHexString(txHashHex)

const depositTxIdA = Bytes.fromHexString(
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
)
const depositTxIdB = Bytes.fromHexString(
  '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
)

function createDepositConfirmedEvent(
  logIndex: i32,
  depositTxId: Bytes,
  depositSats: BigInt,
  netSatsAfterFee: BigInt,
): DepositConfirmedEvent {
  const event = changetype<DepositConfirmedEvent>(newMockEvent())
  event.logIndex = BigInt.fromI32(logIndex)
  event.transaction.hash = txHash
  event.parameters = new Array<ethereum.EventParam>()
  event.parameters.push(
    new ethereum.EventParam('vault', ethereum.Value.fromAddress(vault)),
  )
  event.parameters.push(
    new ethereum.EventParam('recipient', ethereum.Value.fromAddress(recipient)),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'depositTxId',
      ethereum.Value.fromFixedBytes(depositTxId),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'depositSats',
      ethereum.Value.fromUnsignedBigInt(depositSats),
    ),
  )
  event.parameters.push(
    new ethereum.EventParam(
      'netSatsAfterFee',
      ethereum.Value.fromUnsignedBigInt(netSatsAfterFee),
    ),
  )
  return event
}

describe('handleDepositConfirmed', function () {
  beforeEach(function () {
    clearStore()
  })

  test('stores one entity per event when a transaction emits several DepositConfirmed events', function () {
    handleDepositConfirmed(
      createDepositConfirmedEvent(
        0,
        depositTxIdA,
        BigInt.fromI32(100000),
        BigInt.fromI32(99000),
      ),
    )
    handleDepositConfirmed(
      createDepositConfirmedEvent(
        1,
        depositTxIdB,
        BigInt.fromI32(250000),
        BigInt.fromI32(247500),
      ),
    )

    assert.entityCount('BtcConfirmedDeposit', 2)

    const idA = txHashHex + '-0'
    const idB = txHashHex + '-1'

    assert.fieldEquals(
      'BtcConfirmedDeposit',
      idA,
      'depositTxId',
      depositTxIdA.toHexString(),
    )
    assert.fieldEquals('BtcConfirmedDeposit', idA, 'depositSats', '100000')
    assert.fieldEquals('BtcConfirmedDeposit', idA, 'netSatsAfterFee', '99000')
    assert.fieldEquals('BtcConfirmedDeposit', idA, 'transactionHash', txHashHex)

    assert.fieldEquals(
      'BtcConfirmedDeposit',
      idB,
      'depositTxId',
      depositTxIdB.toHexString(),
    )
    assert.fieldEquals('BtcConfirmedDeposit', idB, 'depositSats', '250000')
    assert.fieldEquals('BtcConfirmedDeposit', idB, 'netSatsAfterFee', '247500')
    assert.fieldEquals('BtcConfirmedDeposit', idB, 'transactionHash', txHashHex)
  })

  test('maps every field under an id with the log index in decimal', function () {
    const event = createDepositConfirmedEvent(
      12,
      depositTxIdA,
      BigInt.fromI32(5000000),
      BigInt.fromI32(4990000),
    )
    event.block.number = BigInt.fromI32(1125200)
    event.block.timestamp = BigInt.fromI32(1730000000)

    handleDepositConfirmed(event)

    const id = txHashHex + '-12'

    assert.entityCount('BtcConfirmedDeposit', 1)
    assert.notInStore('BtcConfirmedDeposit', txHashHex + '-c')
    assert.fieldEquals('BtcConfirmedDeposit', id, 'blockNumber', '1125200')
    assert.fieldEquals('BtcConfirmedDeposit', id, 'depositSats', '5000000')
    assert.fieldEquals(
      'BtcConfirmedDeposit',
      id,
      'depositTxId',
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    )
    assert.fieldEquals('BtcConfirmedDeposit', id, 'netSatsAfterFee', '4990000')
    assert.fieldEquals(
      'BtcConfirmedDeposit',
      id,
      'recipient',
      '0x0000000000000000000000000000000000000b0b',
    )
    assert.fieldEquals('BtcConfirmedDeposit', id, 'timestamp', '1730000000')
    assert.fieldEquals('BtcConfirmedDeposit', id, 'transactionHash', txHashHex)
    assert.fieldEquals(
      'BtcConfirmedDeposit',
      id,
      'vault',
      '0x000000000000000000000000000000000000beef',
    )
  })
})
