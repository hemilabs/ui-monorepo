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

  const ownWeight = getWeightAt({
    amount,
    at: autoRelock ? snapToEpoch(now) : currentClose,
    lockEnd:
      currentClass === 'transferable'
        ? unlockTime
        : Math.min(unlockTime, positionClass.transferableAfter),
  })

  const withoutPosition = function (rewardClass: RewardClass) {
    const { baseline, weight } = inputsByClass[rewardClass]
    if (rewardClass !== currentClass) {
      return { baseline, weight }
    }
    return {
      baseline,
      weight: weight > ownWeight ? weight - ownWeight : BigInt(0),
    }
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
