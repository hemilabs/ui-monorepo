import { getEpochEnd, getRelockedWeight, getWeightAt } from './lockEpochs'
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
  relockedWeight,
  unlockTime,
}: {
  amount: bigint
  autoRelock: boolean
  decimals: number
  inputsByClass: InputsByClass
  lockDurationInSeconds: number
  now: number
  positionClass: PositionClass
  relockedWeight?: bigint
  unlockTime: number
}) {
  const currentClose = getEpochEnd({ epochsAhead: 0, now })
  const currentClass = getRewardClassAt({ at: currentClose, ...positionClass })

  const weightOf = (lockEnd: number) =>
    autoRelock
      ? getRelockedWeight({ amount, lockEnd, now })
      : getWeightAt({ amount, at: currentClose, lockEnd })

  const wholeWeight =
    autoRelock && relockedWeight !== undefined
      ? relockedWeight
      : weightOf(unlockTime)
  const ownLockEnd =
    currentClass === 'transferable'
      ? unlockTime
      : Math.min(unlockTime, positionClass.transferableAfter)
  const ownWeight =
    ownLockEnd === unlockTime ? wholeWeight : weightOf(ownLockEnd)
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
      relockedWeight,
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
