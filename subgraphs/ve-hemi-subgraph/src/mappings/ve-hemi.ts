import { log } from '@graphprotocol/graph-ts'

import { isZeroAddress } from '../../../utils'
import {
  Deposit as DepositEvent,
  Lock as LockEvent,
  Transfer as TransferEvent,
  Withdraw as WithdrawEvent,
} from '../../generated/VeHemi/VeHemi'
import { LockedPosition } from '../schema/lockedPosition'

// This function is called when a staking position is created or updated.
// As the DepositEvent fires both in creation and update, if the lockedPosition can't be loaded
// it means the position is being created - we must ignore it
export function handleDepositEvent(event: DepositEvent): void {
  const lockedPosition = LockedPosition.load(event.params.tokenId.toString())
  if (lockedPosition === null) {
    log.debug('Skipping DepositEvent for tokenId {} in transaction hash {}', [
      event.params.tokenId.toString(),
      event.transaction.hash.toHexString(),
    ])
    return
  }

  // if the amount was updated, the increased amount is set, if not, zero is send
  // So we can just add it up
  lockedPosition.amount = lockedPosition.amount.plus(event.params.amount)

  // Normalize lockTime: the Deposit event gives us the absolute unlock timestamp,
  // but we want to keep consistency with the Lock event where lockTime is stored as a duration.
  // So here we convert it back to a duration by subtracting the original start timestamp
  const end = event.params.lockTime
  const start = lockedPosition.timestamp
  lockedPosition.lockTime = end.minus(start)

  log.info('Updating locked position: {}', [lockedPosition.id])
  lockedPosition.save()
}

// This function is called when a new Staking position is created
export function handleNewLock(event: LockEvent): void {
  log.debug(
    'Handling new lock position for tokenId: {} in transaction hash: {}',
    [event.params.tokenId.toString(), event.transaction.hash.toHexString()],
  )

  const lockedPosition = new LockedPosition(event.params.tokenId.toString())
  lockedPosition.amount = event.params.amount
  lockedPosition.blockNumber = event.block.number
  lockedPosition.blockTimestamp = event.block.timestamp
  lockedPosition.forfeitable = event.params.forfeitable
  lockedPosition.lockTime = event.params.lockTime
  lockedPosition.owner = event.params.account
  lockedPosition.pastOwners = []
  lockedPosition.status = 'active'
  // "start" contains the block.timestamp
  lockedPosition.timestamp = event.params.start
  lockedPosition.tokenId = event.params.tokenId
  lockedPosition.transferable = event.params.transferable
  lockedPosition.transactionHash = event.transaction.hash

  log.info('Creating locked position: {}', [lockedPosition.id])
  lockedPosition.save()
}

export function handleWithdraw(event: WithdrawEvent): void {
  log.debug('Handling withdraw for tokenId: {} in transaction hash: {}', [
    event.params.tokenId.toString(),
    event.transaction.hash.toHexString(),
  ])

  const lockedPosition = LockedPosition.load(event.params.tokenId.toString())
  if (lockedPosition === null) {
    log.warning('Trying to withdraw position not found for tokenId: {}', [
      event.params.tokenId.toString(),
    ])
    return
  }

  lockedPosition.status = 'withdrawn'
  log.info('Withdraw locked position: {}', [lockedPosition.id])
  lockedPosition.save()
}

export function handleTransfer(event: TransferEvent): void {
  // if the "from" is the zero address, this is the minting of an NFT so we must skip it
  if (isZeroAddress(event.params.from)) {
    log.debug(
      'Skipping minting event for tokenId: {} in transaction hash: {}',
      [event.params.tokenId.toString(), event.transaction.hash.toHexString()],
    )
    return
  }
  // if the "to" is the zero address, this is the burning of an NFT so we must skip it
  if (isZeroAddress(event.params.to)) {
    log.debug(
      'Skipping burning event for tokenId: {} in transaction hash: {}',
      [event.params.tokenId.toString(), event.transaction.hash.toHexString()],
    )
    return
  }

  log.debug(
    'Handling transfer for tokenId: {} in transaction hash: {} from {} to {}',
    [
      event.params.tokenId.toString(),
      event.transaction.hash.toHexString(),
      event.params.from.toHexString(),
      event.params.to.toHexString(),
    ],
  )

  const lockedPosition = LockedPosition.load(event.params.tokenId.toString())
  if (lockedPosition === null) {
    log.warning('Trying to transfer position not found for tokenId: {}', [
      event.params.tokenId.toString(),
    ])
    return
  }

  const newOwner = event.params.to

  // only add the owner if not already present - user could've owned it in the past
  if (!lockedPosition.pastOwners.includes(lockedPosition.owner)) {
    lockedPosition.pastOwners.push(lockedPosition.owner)
  }

  lockedPosition.owner = newOwner

  log.info('Transfer locked position: {} in {}', [
    lockedPosition.id,
    event.transaction.hash.toHexString(),
  ])

  lockedPosition.save()
}
