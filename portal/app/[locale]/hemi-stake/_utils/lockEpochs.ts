import { MaxLockDurationSeconds, SixDaysSeconds } from 've-hemi-actions'

const maxLockSeconds = BigInt(MaxLockDurationSeconds)

const snapToEpoch = (timestamp: number) =>
  Math.floor(timestamp / SixDaysSeconds) * SixDaysSeconds

export const getLockEnd = ({
  lockTime,
  timestamp,
}: {
  lockTime: number
  timestamp: number
}) => snapToEpoch(timestamp + lockTime)

// Each baseline settles at (epoch + 1) * length, so 0 is the close of the epoch `now` is in.
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
  at < lockEnd ? (amount / maxLockSeconds) * BigInt(lockEnd - at) : BigInt(0)
