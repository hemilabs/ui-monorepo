import { snapToEpoch } from 've-hemi-actions'

import { getEpochEnd, getWeightAt } from './lockEpochs'
import { toStackedPayoutSeries } from './payoutsChartData'
import {
  getRewardClassAt,
  type InputsByClass,
  type PositionClass,
  type RewardClass,
} from './rewardClass'
import { getRewardsForecast } from './stakeRewardsForecast'

export const getAutoRelockComparison = function ({
  amount,
  autoRelock,
  decimals,
  inputsByClass,
  lockDurationInSeconds,
  now,
  positionClass,
  unlockTime,
}: {
  amount: bigint
  autoRelock: boolean
  decimals: number
  inputsByClass: InputsByClass
  lockDurationInSeconds: number
  now: number
  positionClass: PositionClass
  unlockTime: number
}) {
  const currentClose = getEpochEnd({ epochsAhead: 0, now })
  const currentClass = getRewardClassAt({ at: currentClose, ...positionClass })

  const at = autoRelock ? snapToEpoch(now) : currentClose
  const wholeWeight = getWeightAt({ amount, at, lockEnd: unlockTime })
  const ownWeight = getWeightAt({
    amount,
    at,
    lockEnd:
      currentClass === 'transferable'
        ? unlockTime
        : Math.min(unlockTime, positionClass.transferableAfter),
  })
  const extendedWeight = wholeWeight - ownWeight

  const ownShareOf = function (rewardClass: RewardClass) {
    if (rewardClass === currentClass) {
      return ownWeight
    }
    return rewardClass === 'transferable' ? extendedWeight : BigInt(0)
  }

  const withoutPosition = function (rewardClass: RewardClass) {
    const { baseline, weight } = inputsByClass[rewardClass]
    const own = ownShareOf(rewardClass)
    return { baseline, weight: weight > own ? weight - own : BigInt(0) }
  }
  const otherPositions: InputsByClass = {
    forfeitable: withoutPosition('forfeitable'),
    locked: withoutPosition('locked'),
    transferable: withoutPosition('transferable'),
  }

  const buildForecast = (relocked: boolean) =>
    getRewardsForecast({
      amount,
      autoRelock: relocked,
      inputsByClass: otherPositions,
      lockDurationInSeconds,
      now,
      positionClass,
    })

  const current = buildForecast(autoRelock)
  const next = buildForecast(!autoRelock)
  const { base, delta } = toStackedPayoutSeries({
    current: current.payouts,
    decimals,
    next: next.payouts,
  })

  return { base, current, delta, next }
}
