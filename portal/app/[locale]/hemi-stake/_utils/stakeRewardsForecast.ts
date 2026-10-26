import {
  MaxLockDurationSeconds,
  minLockAmount,
  SixDaysSeconds,
} from 've-hemi-actions'

import {
  getEpochEnd,
  getLockEnd,
  getRelockedWeight,
  getWeightAt,
} from './lockEpochs'
import {
  alwaysTransferable,
  getRewardClassAt,
  type InputsByClass,
  type PositionClass,
} from './rewardClass'

const epochsPerYear = MaxLockDurationSeconds / (4 * SixDaysSeconds)

const toFraction = function (numerator: bigint, denominator: bigint) {
  if (denominator === BigInt(0)) {
    return 0
  }
  return Number(numerator) / Number(denominator)
}

const capAtMaxLock = (lockDurationInSeconds: number) =>
  Math.min(lockDurationInSeconds, MaxLockDurationSeconds)

export const getEpochPayout = function ({
  baseline,
  classWeight,
  weight,
}: {
  baseline: bigint
  classWeight: bigint
  weight: bigint
}) {
  const denominator = classWeight + weight
  if (denominator === BigInt(0)) {
    return BigInt(0)
  }
  return (baseline * weight) / denominator
}

export const getWeightShare = ({
  classWeight,
  weight,
}: {
  classWeight: bigint
  weight: bigint
}) => toFraction(weight, classWeight + weight)

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
  inputsByClass,
  lockDurationInSeconds,
  now,
  positionClass = alwaysTransferable,
  relockedWeight,
}: {
  amount: bigint
  autoRelock?: boolean
  inputsByClass: InputsByClass
  lockDurationInSeconds: number
  now: number
  positionClass?: PositionClass
  relockedWeight?: bigint
}) {
  const lockEnd = getLockEnd({
    lockTime: capAtMaxLock(lockDurationInSeconds),
    timestamp: now,
  })

  const heldWeight = autoRelock
    ? (relockedWeight ?? getRelockedWeight({ amount, lockEnd, now }))
    : BigInt(0)

  const payouts = Array.from(
    { length: epochsPerYear },
    function (_, epochsAhead) {
      const timestamp = getEpochEnd({ epochsAhead, now })
      const weight = autoRelock
        ? heldWeight
        : getWeightAt({ amount, at: timestamp, lockEnd })
      const rewardClass = getRewardClassAt({ at: timestamp, ...positionClass })
      const { baseline = BigInt(0), weight: classWeight } =
        inputsByClass[rewardClass]

      return {
        epochsAhead,
        payout: getEpochPayout({ baseline, classWeight, weight }),
        rewardClass,
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
  inputsByClass,
  lockDurationsInSeconds,
  now,
  positionClass,
}: {
  amount: bigint
  autoRelock?: boolean
  inputsByClass: InputsByClass
  lockDurationsInSeconds: number[]
  now: number
  positionClass?: PositionClass
}) =>
  lockDurationsInSeconds.map(lockDurationInSeconds => ({
    ...getRewardsForecast({
      amount,
      autoRelock,
      inputsByClass,
      lockDurationInSeconds,
      now,
      positionClass,
    }),
    lockDurationInSeconds,
  }))
