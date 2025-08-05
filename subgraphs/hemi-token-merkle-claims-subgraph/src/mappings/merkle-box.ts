import { log } from '@graphprotocol/graph-ts'

import { MerkleClaim as MerkleClaimEvent } from '../../generated/MerkleBox/MerkleBox'
import { MerkleClaim } from '../../generated/schema'

export function handleMerkleClaim(event: MerkleClaimEvent): void {
  log.debug('Found claim operation {}', [event.transaction.hash.toHexString()])

  let entity = new MerkleClaim(
    event.params.account.toHex() + '-' + event.params.claimGroup.toString(),
  )
  entity.account = event.params.account
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.claimGroup = event.params.claimGroup
  entity.erc20 = event.params.erc20
  entity.ratio = event.params.ratio
  entity.transactionHash = event.transaction.hash
  entity.lockupMonths = event.params.lockupMonths.toI32()
  entity.mintedNFT = event.params.mintedNFT

  entity.save()

  log.info('Claim operation {} saved', [event.transaction.hash.toHexString()])
}
