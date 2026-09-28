import { MaxLockDurationSeconds, SixDaysSeconds } from 've-hemi-actions'

const maxLockSeconds = BigInt(MaxLockDurationSeconds)

const snapToEpoch = (timestamp: number) =>
  Math.floor(timestamp / SixDaysSeconds) * SixDaysSeconds

// The contract stores every lock end on an epoch boundary, rounding the rest away.
export const getLockEnd = ({
  lockTime,
  timestamp,
}: {
  lockTime: number
  timestamp: number
}) => snapToEpoch(timestamp + lockTime)

// Each pot settles at (epoch + 1) * length, so 0 is the close of the epoch `now` is in.
export const getEpochEnd = ({
  epochsAhead,
  now,
}: {
  epochsAhead: number
  now: number
}) => snapToEpoch(now) + (epochsAhead + 1) * SixDaysSeconds

export const getWeightAt = ({
  amount,
  at,
  lockEnd,
}: {
  amount: bigint
  at: number
  lockEnd: number
}) =>
  at < lockEnd ? (amount * BigInt(lockEnd - at)) / maxLockSeconds : BigInt(0)
