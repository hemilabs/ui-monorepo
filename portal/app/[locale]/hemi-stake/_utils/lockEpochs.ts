import {
  MaxLockDurationSeconds,
  SixDaysSeconds,
  snapToEpoch,
} from 've-hemi-actions'

const maxLockSeconds = BigInt(MaxLockDurationSeconds)

export const getLockEnd = ({
  effectiveLockEnd,
  lockTime,
  timestamp,
}: {
  effectiveLockEnd?: bigint
  lockTime: number
  timestamp: number
}) =>
  effectiveLockEnd === undefined
    ? snapToEpoch(timestamp + lockTime)
    : Number(effectiveLockEnd)

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
