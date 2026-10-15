import { snapToEpoch } from 've-hemi-actions'

import { getEpochEnd, getWeightAt } from './lockEpochs'
import { toStackedPayoutSeries } from './payoutsChartData'
import { getRewardsForecast } from './stakeRewardsForecast'

export const getAutoRelockComparison = function ({
  amount,
  autoRelock,
  baseline,
  classWeight,
  decimals,
  lockDurationInSeconds,
  now,
  unlockTime,
}: {
  amount: bigint
  autoRelock: boolean
  baseline: bigint
  classWeight: bigint
  decimals: number
  lockDurationInSeconds: number
  now: number
  unlockTime: number
}) {
  const positionWeightAtClose = getWeightAt({
    amount,
    at: autoRelock ? snapToEpoch(now) : getEpochEnd({ epochsAhead: 0, now }),
    lockEnd: unlockTime,
  })
  const otherPositionsWeight =
    classWeight > positionWeightAtClose
      ? classWeight - positionWeightAtClose
      : BigInt(0)

  const buildForecast = (relocked: boolean) =>
    getRewardsForecast({
      amount,
      autoRelock: relocked,
      lockDurationInSeconds,
      now,
      transferableClassBaseline: baseline,
      transferableClassWeight: otherPositionsWeight,
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
