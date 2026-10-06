import Skeleton from 'react-loading-skeleton'
import { useTranslations } from 'use-intl'
import { unixNowTimestamp } from 'utils/time'

import { formatApy } from '../_utils/formatApy'
import { getLockupApys } from '../_utils/lockupApy'

import { useEpochSystemState } from './useEpochSystemState'
import { useRewardsForecastInputs } from './useRewardsForecastInputs'

export const useLockupApySublabels = function (amount: bigint) {
  const t = useTranslations('hemi-stake.form')
  const { isError: isSystemStateError } = useEpochSystemState()
  const { data: forecastInputs, isError: isForecastError } =
    useRewardsForecastInputs()

  const apys = getLockupApys({
    amount,
    now: Number(unixNowTimestamp()),
    transferableClassBaseline:
      forecastInputs?.transferableClassBaseline ?? BigInt(0),
    transferableClassWeight:
      forecastInputs?.transferableClassWeight ?? BigInt(0),
  })

  const toSublabel = function (ratio: number) {
    if (forecastInputs?.transferableClassBaseline !== undefined) {
      return t('approximate', { percentage: formatApy(ratio) })
    }
    if (forecastInputs !== undefined || isForecastError || isSystemStateError) {
      return undefined
    }
    return <Skeleton className="w-10" />
  }

  return Object.fromEntries(
    Object.entries(apys).map(([days, ratio]) => [days, toSublabel(ratio)]),
  )
}
