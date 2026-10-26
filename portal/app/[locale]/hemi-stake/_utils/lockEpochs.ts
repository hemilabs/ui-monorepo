import {
  halfEpochSeconds,
  MaxLockDurationSeconds,
  SixDaysSeconds,
  snapToEpoch,
} from 've-hemi-actions'

const maxLockSeconds = BigInt(MaxLockDurationSeconds)

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

export const getRelockedWeight = ({
  amount,
  lockEnd,
  now,
}: {
  amount: bigint
  lockEnd: number
  now: number
}) => getWeightAt({ amount, at: snapToEpoch(now) + halfEpochSeconds, lockEnd })

type PositionWeights = {
  current: bigint
  relocked: bigint
}

export const getPositionWeights = ({
  amount,
  autoRelock,
  fromChain,
  lockEnd,
  now,
}: {
  amount: bigint
  autoRelock: boolean
  fromChain: PositionWeights | undefined
  lockEnd: number
  now: number
}): PositionWeights =>
  fromChain ?? {
    current: autoRelock
      ? getRelockedWeight({ amount, lockEnd, now })
      : getWeightAt({ amount, at: now, lockEnd }),
    relocked: getRelockedWeight({ amount, lockEnd, now }),
  }
