import { BigInt } from '@graphprotocol/graph-ts'

import { LockedPosition } from '../../generated/schema'

// See https://github.com/hemilabs/veHEMI/blob/c6a65c74154377e8720f584b364bdc109fbdedc5/src/VeHemi.sol#L89
// In seconds.
const sixDays = BigInt.fromI32(525960)

export const getUnlockTime = (start: BigInt, lockDuration: BigInt): BigInt =>
  start.plus(lockDuration).div(sixDays).times(sixDays)

export const getLockDuration = (position: LockedPosition): BigInt =>
  position.unlockTime.minus(position.timestamp)
