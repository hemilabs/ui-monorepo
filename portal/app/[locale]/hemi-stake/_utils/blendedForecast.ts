import { toFraction } from 'utils/bigint'

import {
  capAtMaxLock,
  epochsPerYear,
  getEpochEnd,
  getLockEnd,
  getWeightAt,
} from './lockEpochs'
import {
  alwaysTransferable,
  type InputsByClass,
  type PositionClass,
  rewardClasses,
  type RewardClass,
} from './rewardClass'

type ClassWeights = Partial<Record<RewardClass, bigint>>

const weightOf = (weights: ClassWeights, rewardClass: RewardClass) =>
  weights[rewardClass] ?? BigInt(0)

// Until transferableAfter the contract splits a position across two pots: the
// weight measured against that instant competes in its own class, and whatever
// is left of the weight measured against the lock end goes to Transferable.
export const getClassWeights = function ({
  amount,
  at,
  lockEnd,
  positionClass,
}: {
  amount: bigint
  at: number
  lockEnd: number
  positionClass: PositionClass
}): ClassWeights {
  const total = getWeightAt({ amount, at, lockEnd })

  if (at >= positionClass.transferableAfter) {
    return { transferable: total }
  }

  const own = getWeightAt({
    amount,
    at,
    lockEnd: Math.min(lockEnd, positionClass.transferableAfter),
  })

  return {
    [positionClass.forfeitable ? 'forfeitable' : 'locked']: own,
    transferable: total - own,
  }
}

const getPayout = ({
  denominators,
  inputsByClass,
  weights,
}: {
  denominators: Record<RewardClass, bigint>
  inputsByClass: InputsByClass
  weights: ClassWeights
}) =>
  rewardClasses.reduce(function (total, rewardClass) {
    const weight = weightOf(weights, rewardClass)
    const denominator = denominators[rewardClass]
    if (weight === BigInt(0) || denominator === BigInt(0)) {
      return total
    }
    const { baseline = BigInt(0) } = inputsByClass[rewardClass]
    return total + (baseline * weight) / denominator
  }, BigInt(0))

const sumWeights = (weights: ClassWeights) =>
  rewardClasses.reduce(
    (total, rewardClass) => total + weightOf(weights, rewardClass),
    BigInt(0),
  )

type ExistingPosition = {
  amount: bigint
  lockEnd: number
  positionClass: PositionClass
}

export const getBlendedForecast = function ({
  existing,
  incoming,
  inputsByClass,
  now,
}: {
  existing: ExistingPosition[]
  incoming: {
    amount: bigint
    lockDurationInSeconds: number
  }
  inputsByClass: InputsByClass
  now: number
}) {
  const settledAt = getEpochEnd({ epochsAhead: 0, now })
  const staked = existing.filter(position => position.lockEnd > settledAt)

  const incomingLockEnd = getLockEnd({
    lockTime: capAtMaxLock(incoming.lockDurationInSeconds),
    timestamp: now,
  })

  const atSettled = staked.map(position =>
    getClassWeights({ ...position, at: settledAt }),
  )

  const epochs = Array.from({ length: epochsPerYear }, function (_, index) {
    const at = getEpochEnd({ epochsAhead: index, now })
    const stakedWeights = staked.map(position =>
      getClassWeights({ ...position, at }),
    )
    const incomingWeights = getClassWeights({
      amount: incoming.amount,
      at,
      lockEnd: incomingLockEnd,
      positionClass: alwaysTransferable,
    })

    // The denominators are frozen at the settled epoch, where they already
    // count what is staked. What shifts them is how the wallet's own weight
    // changes from that instant, by decay, expiry or a class crossing, plus
    // the position that is not on chain yet.
    const denominators = Object.fromEntries(
      rewardClasses.map(function (rewardClass) {
        const moved = stakedWeights.reduce(
          (total, weights, position) =>
            total +
            weightOf(weights, rewardClass) -
            weightOf(atSettled[position], rewardClass),
          BigInt(0),
        )
        return [
          rewardClass,
          inputsByClass[rewardClass].weight +
            moved +
            weightOf(incomingWeights, rewardClass),
        ]
      }),
    ) as Record<RewardClass, bigint>

    const forLeg = (legWeights: ClassWeights[]) => ({
      payout: legWeights.reduce(
        (total, weights) =>
          total + getPayout({ denominators, inputsByClass, weights }),
        BigInt(0),
      ),
      weight: legWeights.reduce(
        (total, weights) => total + sumWeights(weights),
        BigInt(0),
      ),
    })

    return {
      epochsAhead: index,
      existing: forLeg(stakedWeights),
      incoming: forLeg([incomingWeights]),
      timestamp: at,
    }
  })

  const toLeg = function (amount: bigint, pick: 'existing' | 'incoming') {
    const payouts = epochs.map(epoch => ({
      epochsAhead: epoch.epochsAhead,
      payout: epoch[pick].payout,
      timestamp: epoch.timestamp,
      weight: epoch[pick].weight,
    }))
    const yearOneTotal = payouts.reduce(
      (total, { payout }) => total + payout,
      BigInt(0),
    )
    return {
      payouts,
      yearOneReturnRatio: toFraction(yearOneTotal, amount),
      yearOneTotal,
    }
  }

  const stakedAmount = staked.reduce(
    (total, { amount }) => total + amount,
    BigInt(0),
  )
  const existingLeg = toLeg(stakedAmount, 'existing')
  const incomingLeg = toLeg(incoming.amount, 'incoming')
  const blendedTotal = existingLeg.yearOneTotal + incomingLeg.yearOneTotal

  return {
    blended: {
      lockEnd: incomingLockEnd,
      payouts: epochs.map(epoch => ({
        epochsAhead: epoch.epochsAhead,
        payout: epoch.existing.payout + epoch.incoming.payout,
        timestamp: epoch.timestamp,
        weight: epoch.existing.weight + epoch.incoming.weight,
      })),
      yearOneReturnRatio: toFraction(
        blendedTotal,
        stakedAmount + incoming.amount,
      ),
      yearOneTotal: blendedTotal,
    },
    existing: existingLeg,
    incoming: incomingLeg,
  }
}
