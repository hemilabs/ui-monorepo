import { log } from '@graphprotocol/graph-ts'
import { Deposit as DepositEvent } from '../../generated/VeHemi/VeHemi'
import { LockedPosition } from '../../generated/schema'

function handleNewLock(event: DepositEvent): void {
  const lockedPosition = new LockedPosition(event.params.tokenId.toString())
  lockedPosition.address = event.transaction.from
  lockedPosition.amount = event.params.amount
  lockedPosition.blockNumber = event.block.number
  lockedPosition.blockTimestamp = event.block.timestamp
  lockedPosition.lockTime = event.params.lockTime
  lockedPosition.timestamp = event.params.timestamp
  lockedPosition.tokenId = event.params.tokenId
  lockedPosition.transactionHash = event.transaction.hash
  log.info('Creating locked position: {}', [lockedPosition.id])
  lockedPosition.save()
}

function handleUpdateLock(
  event: DepositEvent,
  lockedPosition: LockedPosition,
): void {
  // if the amount was updated, the increased amount is set, if not, zero is send
  // So we can just add it up
  lockedPosition.amount = lockedPosition.amount.plus(event.params.amount)
  // if the lock time was increased, the new value is emitted. If not, the existing previous one is
  // emitted in the event. So we can just set the last one.
  lockedPosition.lockTime = event.params.lockTime
  log.info('Updating locked position: {}', [lockedPosition.id])
  lockedPosition.save()
}

// While the Lock event is used when a lock is created, in that situation the Deposit event
// is also emitted. In addition to that, only the Deposit is emitted when increasing
// the amount or the lock period. So it's best to just index the DepositEvent and solve
// everything in here.
// Each tokenId identifies a unique position (through an NFT), and these ids are globally unique.
export function handleDeposit(event: DepositEvent): void {
  log.debug('Handling deposit for tokenId: {} in transaction hash: {}', [
    event.params.tokenId.toString(),
    event.transaction.hash.toString(),
  ])
  const id = event.params.tokenId.toString()
  let existingPosition = LockedPosition.load(id)
  if (existingPosition !== null) {
    // The position already exist, so either the amount or the unlock period was updated
    handleUpdateLock(event, existingPosition)
  } else {
    handleNewLock(event)
  }
}
