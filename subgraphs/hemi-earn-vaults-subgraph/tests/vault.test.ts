import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import {
  assert,
  beforeEach,
  clearStore,
  createMockedFunction,
  dataSourceMock,
  describe,
  test,
} from 'matchstick-as/assembly/index'

import { handleBlock } from '../src/mappings/vault'

import { createMockBlock } from './vault-utils'

const vaultAddressString = '0x1234567890123456789012345678901234567890'
const vaultAddress = Address.fromString(vaultAddressString)

const daySeconds = BigInt.fromI32(86400)

function mockVaultCalls(
  decimals: i32,
  shareValue: BigInt,
  totalAssets: BigInt,
): void {
  createMockedFunction(vaultAddress, 'decimals', 'decimals():(uint8)')
    .withArgs([])
    .returns([ethereum.Value.fromI32(decimals)])

  const oneShare = BigInt.fromI32(10).pow(<u8>decimals)
  createMockedFunction(
    vaultAddress,
    'convertToAssets',
    'convertToAssets(uint256):(uint256)',
  )
    .withArgs([ethereum.Value.fromUnsignedBigInt(oneShare)])
    .returns([ethereum.Value.fromUnsignedBigInt(shareValue)])

  createMockedFunction(vaultAddress, 'totalAssets', 'totalAssets():(uint256)')
    .withArgs([])
    .returns([ethereum.Value.fromUnsignedBigInt(totalAssets)])
}

describe('handleBlock', function () {
  beforeEach(function () {
    clearStore()
    dataSourceMock.setAddress(vaultAddressString)
  })

  test('creates VaultHistory with correct id and fields', function () {
    const decimals = 8
    const shareValue = BigInt.fromString('100000000') // 1:1
    const totalAssets = BigInt.fromString('5000000000') // 50 tokens
    const timestamp = BigInt.fromI32(1769731200) // 2026-01-30 00:00:00 UTC

    mockVaultCalls(decimals, shareValue, totalAssets)
    const block = createMockBlock(BigInt.fromI32(100), timestamp)
    handleBlock(block)

    const dayTimestamp = timestamp.div(daySeconds).times(daySeconds)
    const id = vaultAddress.toHexString() + '-' + dayTimestamp.toString()

    assert.entityCount('VaultHistory', 1)
    assert.fieldEquals('VaultHistory', id, 'vault', vaultAddress.toHexString())
    assert.fieldEquals('VaultHistory', id, 'timestamp', dayTimestamp.toString())
    assert.fieldEquals('VaultHistory', id, 'shareValue', shareValue.toString())
    assert.fieldEquals(
      'VaultHistory',
      id,
      'totalAssets',
      totalAssets.toString(),
    )
  })

  test('overwrites VaultHistory on same day', function () {
    const decimals = 8
    const initialShareValue = BigInt.fromString('100000000')
    const initialTotalAssets = BigInt.fromString('5000000000')
    const updatedShareValue = BigInt.fromString('105000000')
    const updatedTotalAssets = BigInt.fromString('5500000000')
    const timestamp1 = BigInt.fromI32(1769734800) // 2026-01-30 01:00:00 UTC
    const timestamp2 = BigInt.fromI32(1769774400) // 2026-01-30 12:00:00 UTC

    mockVaultCalls(decimals, initialShareValue, initialTotalAssets)
    const block1 = createMockBlock(BigInt.fromI32(100), timestamp1)
    handleBlock(block1)

    assert.entityCount('VaultHistory', 1)

    mockVaultCalls(decimals, updatedShareValue, updatedTotalAssets)
    const block2 = createMockBlock(BigInt.fromI32(200), timestamp2)
    handleBlock(block2)

    const dayTimestamp = timestamp1.div(daySeconds).times(daySeconds)
    const id = vaultAddress.toHexString() + '-' + dayTimestamp.toString()

    assert.entityCount('VaultHistory', 1)
    assert.fieldEquals(
      'VaultHistory',
      id,
      'shareValue',
      updatedShareValue.toString(),
    )
    assert.fieldEquals(
      'VaultHistory',
      id,
      'totalAssets',
      updatedTotalAssets.toString(),
    )
  })

  test('creates separate entries for different days', function () {
    const decimals = 8
    const shareValue1 = BigInt.fromString('100000000')
    const totalAssets1 = BigInt.fromString('5000000000')
    const shareValue2 = BigInt.fromString('105000000')
    const totalAssets2 = BigInt.fromString('5500000000')
    const day1Timestamp = BigInt.fromI32(1769731200) // 2026-01-30 00:00:00 UTC
    const day2Timestamp = BigInt.fromI32(1769817600) // 2026-01-31 00:00:00 UTC

    mockVaultCalls(decimals, shareValue1, totalAssets1)
    const block1 = createMockBlock(BigInt.fromI32(100), day1Timestamp)
    handleBlock(block1)

    mockVaultCalls(decimals, shareValue2, totalAssets2)
    const block2 = createMockBlock(BigInt.fromI32(200), day2Timestamp)
    handleBlock(block2)

    assert.entityCount('VaultHistory', 2)

    const id1 =
      vaultAddress.toHexString() +
      '-' +
      day1Timestamp.div(daySeconds).times(daySeconds).toString()
    const id2 =
      vaultAddress.toHexString() +
      '-' +
      day2Timestamp.div(daySeconds).times(daySeconds).toString()

    assert.fieldEquals(
      'VaultHistory',
      id1,
      'shareValue',
      shareValue1.toString(),
    )
    assert.fieldEquals(
      'VaultHistory',
      id2,
      'shareValue',
      shareValue2.toString(),
    )
  })
})
