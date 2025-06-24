import { log } from '@graphprotocol/graph-ts'

import { DepositConfirmed as DepositConfirmedEvent } from '../../generated/BitcoinTunnelManager/BitcoinTunnelManager'
import { BtcConfirmedDeposit } from '../../generated/schema'

export function handleDepositConfirmed(event: DepositConfirmedEvent): void {
  let entity = new BtcConfirmedDeposit(event.transaction.hash)

  entity.blockNumber = event.block.number
  entity.depositTxId = event.params.depositTxId
  entity.depositSats = event.params.depositSats
  entity.netSatsAfterFee = event.params.netSatsAfterFee
  entity.recipient = event.params.recipient
  entity.timestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.vault = event.params.vault

  log.debug('Found btc confirmation for deposit {}', [
    event.params.depositTxId.toHexString(),
  ])

  entity.save()
}
