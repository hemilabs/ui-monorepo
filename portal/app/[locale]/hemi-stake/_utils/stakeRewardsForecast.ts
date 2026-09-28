import {
  MaxLockDurationSeconds,
  minLockAmount,
  MinLockDurationSeconds,
  SixDaysSeconds,
} from 've-hemi-actions'

import { getEpochEnd, getLockEnd, getWeightAt } from './lockEpochs'

const epochsPerYear = MaxLockDurationSeconds / (4 * SixDaysSeconds)

// Dividing as doubles, not as scaled integers: a ratio keeps its significant digits at
// any magnitude, while scaling floors the smallest allowed stake against the class.
const toFraction = function (numerator: bigint, denominator: bigint) {
  if (denominator === BigInt(0)) {
    return 0
  }
  return Number(numerator) / Number(denominator)
}

const clampToLockLimits = (lockDurationInSeconds: number) =>
  Math.min(
    Math.max(lockDurationInSeconds, MinLockDurationSeconds),
    MaxLockDurationSeconds,
  )

// Both operands belong to the transferable class. Total veHEMI supply is ~42x it, so
// passing that instead understates every payout by the same factor.
export const getEpochPayout = function ({
  transferableClassPot,
  transferableClassWeight,
  weight,
}: {
  transferableClassPot: bigint
  transferableClassWeight: bigint
  weight: bigint
}) {
  const denominator = transferableClassWeight + weight
  if (denominator === BigInt(0)) {
    return BigInt(0)
  }
  return (transferableClassPot * weight) / denominator
}

export const getWeightShare = ({
  transferableClassWeight,
  weight,
}: {
  transferableClassWeight: bigint
  weight: bigint
}) => toFraction(weight, transferableClassWeight + weight)

export const getLockMultiplier = ({
  amount,
  weight,
}: {
  amount: bigint
  weight: bigint
}) => toFraction(weight, amount)

export const getRewardsForecast = function ({
  amount,
  lockDurationInSeconds,
  now,
  transferableClassPot,
  transferableClassWeight,
}: {
  amount: bigint
  lockDurationInSeconds: number
  now: number
  transferableClassPot: bigint
  transferableClassWeight: bigint
}) {
  const lockEnd = getLockEnd({
    lockTime: clampToLockLimits(lockDurationInSeconds),
    timestamp: now,
  })

  const payouts = Array.from(
    { length: epochsPerYear },
    function (_, epochsAhead) {
      const timestamp = getEpochEnd({ epochsAhead, now })
      const weight = getWeightAt({ amount, at: timestamp, lockEnd })
      return {
        epochsAhead,
        payout: getEpochPayout({
          transferableClassPot,
          transferableClassWeight,
          weight,
        }),
        timestamp,
        weight,
      }
    },
  )

  const yearOneTotal = payouts.reduce(
    (total, { payout }) => total + payout,
    BigInt(0),
  )

  return {
    lockEnd,
    meetsMinimumAmount: amount >= minLockAmount,
    nextPayout: payouts[0].payout,
    payouts,
    yearOneReturnRatio: toFraction(yearOneTotal, amount),
    yearOneTotal,
  }
}

export const getRewardsForecastByLockDurations = ({
  amount,
  lockDurationsInSeconds,
  now,
  transferableClassPot,
  transferableClassWeight,
}: {
  amount: bigint
  lockDurationsInSeconds: number[]
  now: number
  transferableClassPot: bigint
  transferableClassWeight: bigint
}) =>
  lockDurationsInSeconds.map(lockDurationInSeconds => ({
    ...getRewardsForecast({
      amount,
      lockDurationInSeconds,
      now,
      transferableClassPot,
      transferableClassWeight,
    }),
    lockDurationInSeconds,
  }))
