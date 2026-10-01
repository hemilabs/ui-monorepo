import { useHemiToken } from 'hooks/useHemiToken'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { useLocale, useTranslations } from 'use-intl'
import { formatShortDate } from 'utils/format'
import { unixNowTimestamp } from 'utils/time'
import { parseTokenUnits } from 'utils/token'

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
  lockDurationInSeconds,
  weight,
}: {
  amount: bigint
  decimals: number
  lockDurationInSeconds: number
  baseline: bigint
  weight: bigint
}) {
  const forecast = getRewardsForecast({
    amount,
    lockDurationInSeconds,
    now: Number(unixNowTimestamp()),
    transferableClassBaseline: baseline,
    transferableClassWeight: weight,
  })
  const series = toPayoutSeries({
    decimals,
    lockEnd: forecast.lockEnd,
    payouts: forecast.payouts,
  })
  const hasForecast = baseline > BigInt(0) && forecast.meetsMinimumAmount

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
  const hasBaseline = baseline > BigInt(0)

  const hasError = isSystemStateError || isForecastError
  const retry = isSystemStateError ? refetchSystemState : refetchForecast
  const price = toPrice(prices?.[token.symbol])

  const { chartSeries, forecast, hasForecast } = buildForecast({
    amount,
    baseline,
    decimals: token.decimals,
    lockDurationInSeconds: Number(wholeDaysToSeconds(lockupDays)),
    weight,
  })

  return (
    <div className="flex w-full flex-col gap-y-4 rounded-lg border border-solid border-transparent bg-neutral-50 p-4 ring-1 ring-transparent hover:shadow-bs">
      {/* TODO #2368 bring back the advanced estimator button on this row, with
          its `advanced-estimator` label, once that page exists */}
      <span className={sectionLabelClassName}>{t('title')}</span>
      <div className="min-h-20">
        {hasForecast && systemState !== undefined ? (
          <PayoutHeadline
            currentEpoch={systemState.currentEpoch}
            input={input}
            lockEnd={forecast.lockEnd}
            lockupDays={lockupDays}
            nextPayout={chartSeries[0]}
            price={price}
            symbol={token.symbol}
          />
        ) : (
          <PayoutPlaceholder
            hasBaseline={hasBaseline}
            hasError={hasError}
            isPending={isPending}
            lockEnd={forecast.lockEnd}
            onRetry={retry}
          />
        )}
      </div>
      <div className="flex w-full flex-col gap-y-1.5">
        <span className={sectionLabelClassName}>
          {systemState === undefined
            ? '\u00a0'
            : t('starting-from-epoch', { epoch: systemState.currentEpoch })}
        </span>
        <PayoutsChart
          formatTick={value =>
            formatPayoutValue({ locale, price, symbol: token.symbol, value })
          }
          formatTickDate={value =>
            formatShortDate(new Date(value), locale, 'UTC')
          }
          formatTooltipValue={value =>
            formatPayoutValue({
              locale,
              precision: 'full',
              price,
              symbol: token.symbol,
              value,
            })
          }
          isPending={isPending && !hasError}
          series={chartSeries}
          ticks={getPayoutAxisTicks(chartSeries)}
          unlockX={getUnlockMarkerX(chartSeries)}
        />
      </div>
    </div>
  )
}
