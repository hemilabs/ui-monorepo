import { useHemiToken } from 'hooks/useHemiToken'
import { useTokenPrices } from 'hooks/useTokenPrices'
import Skeleton from 'react-loading-skeleton'
import { useLocale, useTranslations } from 'use-intl'
import { formatShortDate } from 'utils/format'
import { unixNowTimestamp } from 'utils/time'
import { getTokenPrice, parseTokenUnits } from 'utils/token'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useEpochSystemState } from '../../_hooks/useEpochSystemState'
import { useRewardsForecastInputs } from '../../_hooks/useRewardsForecastInputs'
import { formatPayoutValue } from '../../_utils/formatPayoutValue'
import { wholeDaysToSeconds } from '../../_utils/lockCreationTimes'
import {
  getPayoutAxisTicks,
  getUnlockMarkerX,
  toPayoutSeries,
} from '../../_utils/payoutsChartData'
import { getRewardsForecast } from '../../_utils/stakeRewardsForecast'
import { isValidLockup } from '../lockup'

import { PayoutHeadline } from './payoutHeadline'
import { PayoutPlaceholder } from './payoutPlaceholder'
import { PayoutsChart } from './payoutsChart'

const sectionLabelClassName =
  'text-xxs font-medium uppercase tracking-widest text-neutral-500'

const toPrice = function (value: string | undefined) {
  const price = Number(value)
  return value !== undefined && Number.isFinite(price) && price > 0
    ? price
    : undefined
}

const buildForecast = function ({
  amount,
  baseline,
  decimals,
  hasValidLockup,
  lockupDays,
  weight,
}: {
  amount: bigint
  baseline: bigint
  decimals: number
  hasValidLockup: boolean
  lockupDays: number
  weight: bigint
}) {
  const forecast = getRewardsForecast({
    amount,
    lockDurationInSeconds: Number(wholeDaysToSeconds(lockupDays)),
    now: Number(unixNowTimestamp()),
    transferableClassBaseline: baseline,
    transferableClassWeight: weight,
  })
  const series = toPayoutSeries({
    decimals,
    lockEnd: forecast.lockEnd,
    payouts: forecast.payouts,
  })
  const hasForecast =
    baseline > BigInt(0) && forecast.meetsMinimumAmount && hasValidLockup

  return {
    chartSeries: hasForecast
      ? series
      : series.map(point => ({ ...point, afterUnlock: false, y: 0 })),
    forecast,
    hasForecast,
  }
}

export const EstimatedPayouts = function () {
  const locale = useLocale()
  const t = useTranslations('hemi-stake.estimated-payouts')
  const token = useHemiToken()
  const { input, lockupDays } = useStakingDashboard()
  const {
    data: systemState,
    isError: isSystemStateError,
    refetch: refetchSystemState,
  } = useEpochSystemState()
  const {
    data: forecastInputs,
    isError: isForecastError,
    isPending,
    refetch: refetchForecast,
  } = useRewardsForecastInputs()
  const { data: prices } = useTokenPrices()

  const amount = parseTokenUnits(input, token)
  const baseline = forecastInputs?.transferableClassBaseline ?? BigInt(0)
  const weight = forecastInputs?.transferableClassWeight ?? BigInt(0)

  const hasValidLockup = isValidLockup({ value: lockupDays })
  const hasError = isSystemStateError || isForecastError
  const retry = isSystemStateError ? refetchSystemState : refetchForecast
  const price = toPrice(getTokenPrice(token, prices))

  const { chartSeries, forecast, hasForecast } = buildForecast({
    amount,
    baseline,
    decimals: token.decimals,
    hasValidLockup,
    lockupDays,
    weight,
  })

  return (
    <div className="flex w-full flex-col gap-y-4 rounded-lg border border-solid border-transparent bg-neutral-50 p-4 ring-1 ring-transparent hover:shadow-bs">
      {/* TODO #2368 bring back the advanced estimator button on this row, with
          its `advanced-estimator` label, once that page exists */}
      <span className={sectionLabelClassName}>{t('title')}</span>
      <div className="min-h-24.5">
        {hasForecast && systemState !== undefined ? (
          <PayoutHeadline
            carriedFrom={forecastInputs?.carriedFrom}
            currentEpoch={systemState.currentEpoch}
            input={input}
            lockEnd={forecast.lockEnd}
            lockupDays={lockupDays}
            nextPayout={forecast.payouts[0].payout}
            nextPayoutAt={forecast.payouts[0].timestamp}
            yearOneTotal={forecast.yearOneTotal}
          />
        ) : (
          <PayoutPlaceholder
            hasError={hasError}
            hasValidLockup={hasValidLockup}
            isPending={isPending}
            lockEnd={forecast.lockEnd}
            meetsMinimumAmount={forecast.meetsMinimumAmount}
            onRetry={retry}
          />
        )}
      </div>
      <div className="flex w-full flex-col gap-y-1.5">
        <span className={sectionLabelClassName}>
          {t.rich('starting-from-epoch', {
            epoch: () =>
              systemState === undefined ? (
                <Skeleton className="w-8" />
              ) : (
                systemState.currentEpoch
              ),
          })}
        </span>
        <PayoutsChart
          formatDate={value => formatShortDate(new Date(value), locale)}
          formatValue={value =>
            formatPayoutValue({ price, symbol: token.symbol, value })
          }
          isPending={isPending && !hasError && forecast.meetsMinimumAmount}
          series={chartSeries}
          ticks={getPayoutAxisTicks(chartSeries)}
          unlockX={getUnlockMarkerX(chartSeries)}
        />
      </div>
    </div>
  )
}
