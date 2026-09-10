import { BigInt } from '@graphprotocol/graph-ts'

import { LockStats } from '../../generated/schema'

const lockStatsId = 'singleton'

export function loadLockStats(): LockStats {
  const stats = LockStats.load(lockStatsId)
  if (stats !== null) {
    return stats
  }

  const newStats = new LockStats(lockStatsId)
  newStats.activeLocks = 0
  newStats.totalLockDuration = BigInt.zero()
  return newStats
}
