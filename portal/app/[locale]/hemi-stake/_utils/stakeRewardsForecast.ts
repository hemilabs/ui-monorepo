import {
  MaxLockDurationSeconds,
  minLockAmount,
  MinLockDurationSeconds,
  SixDaysSeconds,
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
  lockDurationInSeconds,
  now,
  transferableClassBaseline,
  transferableClassWeight,
}: {
  amount: bigint
  lockDurationInSeconds: number
  now: number
  transferableClassBaseline: bigint
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
  lockDurationsInSeconds,
  now,
  transferableClassBaseline,
  transferableClassWeight,
}: {
  amount: bigint
  lockDurationsInSeconds: number[]
  now: number
  transferableClassBaseline: bigint
  transferableClassWeight: bigint
}) =>
  lockDurationsInSeconds.map(lockDurationInSeconds => ({
    ...getRewardsForecast({
      amount,
      lockDurationInSeconds,
      now,
      transferableClassBaseline,
      transferableClassWeight,
    }),
    lockDurationInSeconds,
  }))
