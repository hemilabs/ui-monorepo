import {
  MaxLockDurationSeconds,
  minLockAmount,
  MinLockDurationSeconds,
  SixDaysSeconds,
  snapToEpoch,
} from 've-hemi-actions'

import { getEpochEnd, getLockEnd, getWeightAt } from './lockEpochs'

const epochsPerYear = MaxLockDurationSeconds / (4 * SixDaysSeconds)

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

export const getEpochPayout = function ({
  transferableClassBaseline,
  transferableClassWeight,
  weight,
}: {
  transferableClassBaseline: bigint
  transferableClassWeight: bigint
  weight: bigint
}) {
  const denominator = transferableClassWeight + weight
  if (denominator === BigInt(0)) {
    return BigInt(0)
  }
  return (transferableClassBaseline * weight) / denominator
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
  autoRelock = false,
  lockDurationInSeconds,
  now,
  transferableClassBaseline,
  transferableClassWeight,
}: {
  amount: bigint
  autoRelock?: boolean
  lockDurationInSeconds: number
  now: number
  transferableClassBaseline: bigint
  transferableClassWeight: bigint
}) {
  const lockEnd = getLockEnd({
    lockTime: clampToLockLimits(lockDurationInSeconds),
    timestamp: now,
  })

  const relockedWeight = autoRelock
    ? getWeightAt({ amount, at: snapToEpoch(now), lockEnd })
    : BigInt(0)

  const payouts = Array.from(
    { length: epochsPerYear },
    function (_, epochsAhead) {
      const timestamp = getEpochEnd({ epochsAhead, now })
      const weight = autoRelock
        ? relockedWeight
        : getWeightAt({ amount, at: timestamp, lockEnd })
      return {
        epochsAhead,
        payout: getEpochPayout({
          transferableClassBaseline,
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
  autoRelock,
  lockDurationsInSeconds,
  now,
  transferableClassBaseline,
  transferableClassWeight,
}: {
  amount: bigint
  autoRelock?: boolean
  lockDurationsInSeconds: number[]
  now: number
  transferableClassBaseline: bigint
  transferableClassWeight: bigint
}) =>
  lockDurationsInSeconds.map(lockDurationInSeconds => ({
    ...getRewardsForecast({
      amount,
      autoRelock,
      lockDurationInSeconds,
      now,
      transferableClassBaseline,
      transferableClassWeight,
    }),
    lockDurationInSeconds,
  }))
