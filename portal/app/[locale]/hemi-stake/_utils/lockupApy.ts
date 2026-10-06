import { minLockAmount } from 've-hemi-actions'

import {
  maxDays,
  oneYear,
  sixMonths,
  twoYears,
  wholeDaysToSeconds,
} from './lockCreationTimes'
import { getRewardsForecastByLockDurations } from './stakeRewardsForecast'

const presetDays = [sixMonths, oneYear, twoYears, maxDays]

export const getLockupApys = function ({
  amount,
  now,
  transferableClassBaseline,
  transferableClassWeight,
}: {
  amount: bigint
  now: number
  transferableClassBaseline: bigint
  transferableClassWeight: bigint
}) {
  const forecasts = getRewardsForecastByLockDurations({
    amount: amount < minLockAmount ? minLockAmount : amount,
    lockDurationsInSeconds: presetDays.map(days =>
      Number(wholeDaysToSeconds(days)),
    ),
    now,
    transferableClassBaseline,
    transferableClassWeight,
  })

  return Object.fromEntries(
    presetDays.map((days, index) => [
      days,
      forecasts[index].yearOneReturnRatio,
    ]),
  )
}
