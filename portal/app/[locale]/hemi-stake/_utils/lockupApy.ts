import { minLockAmount } from 've-hemi-actions'

import {
  maxDays,
  oneYear,
  sixMonths,
  twoYears,
  wholeDaysToSeconds,
} from './lockCreationTimes'
import { type InputsByClass } from './rewardClass'
import { getRewardsForecastByLockDurations } from './stakeRewardsForecast'

const presetDays = [sixMonths, oneYear, twoYears, maxDays]

export const getLockupApys = function ({
  amount,
  autoRelock,
  inputsByClass,
  now,
}: {
  amount: bigint
  autoRelock?: boolean
  inputsByClass: InputsByClass
  now: number
}) {
  const forecasts = getRewardsForecastByLockDurations({
    amount: amount < minLockAmount ? minLockAmount : amount,
    autoRelock,
    inputsByClass,
    lockDurationsInSeconds: presetDays.map(days =>
      Number(wholeDaysToSeconds(days)),
    ),
    now,
  })

  return Object.fromEntries(
    presetDays.map((days, index) => [
      days,
      forecasts[index].yearOneReturnRatio,
    ]),
  )
}
