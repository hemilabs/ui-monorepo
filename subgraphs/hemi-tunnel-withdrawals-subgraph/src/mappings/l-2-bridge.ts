// Note: This file is written in AssemblyScript. It is required like this to run in the Graph nodes.
// See docs https://www.assemblyscript.org/ - don't let the .ts extension confuse you. It's fairly limited
// and many js/ts operations are not supported
import { dataSource, log } from '@graphprotocol/graph-ts'

import { WithdrawalInitiated as WithdrawalInitiatedEvent } from '../../generated/L2Bridge/L2Bridge'
import { EvmWithdrawal } from '../entities/evmWithdrawal'

const ethereumMainnetId = 1
const hemiMainnetId = 43111
const hemiSepoliaId = 743111
const sepoliaId = 11155111

const chainMap = new Map<string, i32>()
chainMap.set('hemi', hemiMainnetId)
chainMap.set('hemi-sepolia', hemiSepoliaId)

export function handleWithdrawalInitiated(
  event: WithdrawalInitiatedEvent,
): void {
  log.debug('EvmWithdrawal {} found', [event.transaction.hash.toHexString()])
  const entity = new EvmWithdrawal(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  // 1 is direction from L2 to L1
  entity.direction = 1
  entity.from = event.params.from
  entity.l1Token = event.params.l1Token
  entity.l2Token = event.params.l2Token

  entity.l2ChainId = chainMap.get(dataSource.network())
  entity.l1ChainId =
    entity.l2ChainId == hemiMainnetId ? ethereumMainnetId : sepoliaId

  entity.to = event.params.to
  entity.timestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  log.debug('Saving EvmWithdrawal', [])
  entity.save()
  log.info('EvmWithdrawal {} saved', [entity.transactionHash.toHexString()])
}
