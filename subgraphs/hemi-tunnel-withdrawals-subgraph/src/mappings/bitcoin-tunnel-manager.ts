import {
  Address,
  Bytes,
  dataSource,
  log,
  ethereum,
} from '@graphprotocol/graph-ts'

import { getBitcoinChainId, getEvmChainId, zeroAddress } from '../../../utils'
import { WithdrawalInitiated as BtcWithdrawalInitiatedEvent } from '../../generated/BitcoinTunnelManager/BitcoinTunnelManager'
import { BtcWithdrawal } from '../entities/btcWithdrawal'

const bitcoinTokenMap = new Map<string, Address>()
// See https://github.com/hemilabs/token-list/blob/45d5e76798173b896773203482b723235f05d0b5/src/hemi.tokenlist.json#L258
bitcoinTokenMap.set(
  'livenet',
  Address.fromString('0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28'),
)
// See https://github.com/hemilabs/token-list/blob/45d5e76798173b896773203482b723235f05d0b5/src/hemi.tokenlist.json#L404
bitcoinTokenMap.set(
  'testnet',
  Address.fromString('0x36Ab5Dba83d5d470F670BC4c06d7Da685d9afAe7'),
)

const initiateWithdrawalFn = '(uint32,string,uint256)'

export function handleWithdrawalInitiated(
  event: BtcWithdrawalInitiatedEvent,
): void {
  log.debug('BtcWithdrawal {} found', [event.transaction.hash.toHexString()])

  const entity = new BtcWithdrawal(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.amount = event.params.withdrawalSats
  entity.blockNumber = event.block.number
  // 1 is direction from L2 to L1
  entity.direction = 1
  entity.from = event.params.withdrawer

  entity.l2ChainId = getEvmChainId(dataSource.network())
  entity.l1ChainId = getBitcoinChainId(entity.l2ChainId)

  entity.l1Token = zeroAddress
  entity.l2Token = bitcoinTokenMap.get(entity.l1ChainId)

  entity.netSatsAfterFee = event.params.netSatsAfterFee

  entity.timestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.uuid = event.params.uuid

  // Decoding the input data is not that stable for The Graph. There are
  // several issues, and the tool they use (https://github.com/rust-ethereum/ethabi)
  // is deprecated.
  // This is the only way I managed to decode the input, by excluding the signature hash.
  // See https://github.com/graphprotocol/graph-tooling/issues/1088
  // However, for some fields, this doesn't work, so I'm marking it as an optional field.
  // For those cases, the consumer of the graph will need to manually parse the input
  // and add the missing fields.
  const dec = ethereum.decode(
    initiateWithdrawalFn,
    Bytes.fromHexString('0x' + event.transaction.input.toHexString().slice(10)),
  )

  if (!dec) {
    log.debug('Failed to decode BtcWithdrawal input {} for {}', [
      event.transaction.input.toHexString(),
      entity.transactionHash.toHexString(),
    ])
  } else {
    const decodedTuple = dec.toTuple()

    // Here this parameter is the bitcoin address that the vault operator owns
    entity.to = decodedTuple[1].toString()
  }

  log.debug('Saving BtcWithdrawal', [])
  entity.save()
  log.info('BtcWithdrawal {} saved', [entity.transactionHash.toHexString()])
}
