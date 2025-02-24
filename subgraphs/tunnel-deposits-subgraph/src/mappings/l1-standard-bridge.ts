// Note: This file is written in AssemblyScript. It is required like this to run in the Graph nodes.
// See docs https://www.assemblyscript.org/ - don't let the .ts extension confuse you. It's fairly limited
// and many js/ts operations are not supported
import { Address, Bytes, dataSource, log } from '@graphprotocol/graph-ts'

import {
  ERC20DepositInitiated,
  ETHDepositInitiated as ETHDepositInitiatedEvent,
} from '../../generated/L1StandardBridge/L1StandardBridge'
import { Deposit } from '../entities/deposit'

const ethereumMainnetId = 1
const hemiMainnetId = 43111
const hemiSepoliaId = 743111
const sepoliaId = 11155111

const chainMap = new Map<string, i32>()
chainMap.set('mainnet', ethereumMainnetId)
chainMap.set('sepolia', sepoliaId)

export function handleERC20Deposit(event: ERC20DepositInitiated): void {
  log.debug('ERC20 deposit {} found', [event.transaction.hash.toHexString()])
  const entity = new Deposit(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )

  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  // 0 is direction from L1 to L2
  entity.direction = 0
  entity.from = event.params.from
  entity.l1ChainId = chainMap.get(dataSource.network())
  entity.l1Token = event.params.l1Token
  entity.l2Token = event.params.l2Token
  entity.l2ChainId =
    entity.l1ChainId == ethereumMainnetId ? hemiMainnetId : hemiSepoliaId
  entity.to = event.params.to
  entity.timestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  log.debug('Saving ERC20 deposit', [])
  entity.save()
  log.info('ERC20 deposit {} saved', [entity.transactionHash.toHexString()])
}

export function handleETHDeposit(event: ETHDepositInitiatedEvent): void {
  log.debug('ETH deposit {} found', [event.transaction.hash.toHexString()])
  const entity = new Deposit(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.direction = 0
  entity.from = event.params.from
  entity.l1ChainId = chainMap.get(dataSource.network())
  entity.l1Token = Bytes.fromHexString(Address.zero().toHexString())
  // Special address used by OP to store bridged eth
  // See https://github.com/ethereum-optimism/optimism/blob/fa19f9aa250c0f548e0fdd226114aebf2c4c3fed/packages/contracts-bedrock/src/libraries/Predeploys.sol#L51
  // While it is legacy, it is still being used on ETH deposits
  entity.l2Token = Bytes.fromHexString(
    '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000',
  )
  entity.l2ChainId =
    entity.l1ChainId == ethereumMainnetId ? hemiMainnetId : hemiSepoliaId
  entity.to = event.params.to
  entity.timestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  log.debug('Saving ETH deposit', [])
  entity.save()
  log.info('ETH deposit {} saved', [entity.transactionHash.toHexString()])
}
