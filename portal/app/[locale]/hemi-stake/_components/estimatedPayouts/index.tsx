import { Button } from 'components/button'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTokenPrices } from 'hooks/useTokenPrices'
import Skeleton from 'react-loading-skeleton'
import { useLocale, useTranslations } from 'use-intl'
import { formatNumber, formatShortDate } from 'utils/format'
import { unixNowTimestamp } from 'utils/time'
import { parseTokenUnits } from 'utils/token'
import { minLockAmount } from 've-hemi-actions'
import { formatUnits } from 'viem'

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
import { PayoutsChart } from './payoutsChart'

const sectionLabelClassName =
  'text-xxs font-medium uppercase tracking-widest text-neutral-500'

const toPrice = function (value: string | undefined) {
  const price = Number(value)
  return value !== undefined && Number.isFinite(price) && price > 0
    ? price
    : undefined
}

export const EstimatedPayouts = function () {
  const locale = useLocale()
  const t = useTranslations('hemi-stake.estimated-payouts')
  const tCommon = useTranslations('common')
  const token = useHemiToken()
  const { input, lockupDays } = useStakingDashboard()
  const { data: systemState } = useEpochSystemState()
  const {
    data: forecastInputs,
    isError,
    isPending,
    refetch,
  } = useRewardsForecastInputs()
  const { data: prices } = useTokenPrices()

  const amount = parseTokenUnits(input, token)
  const pot = forecastInputs?.transferableClassPot ?? BigInt(0)
  const weight = forecastInputs?.transferableClassWeight ?? BigInt(0)
  const hasPot = pot > BigInt(0)
  const price = toPrice(prices?.[token.symbol])

  const forecast = getRewardsForecast({
    amount,
    lockDurationInSeconds: Number(wholeDaysToSeconds(lockupDays)),
    now: Number(unixNowTimestamp()),
    transferableClassPot: pot,
    transferableClassWeight: weight,
  })

  const series = toPayoutSeries({
    decimals: token.decimals,
    lockEnd: forecast.lockEnd,
    payouts: forecast.payouts,
  })

  const hasForecast = hasPot && forecast.meetsMinimumAmount

  const chartSeries = hasForecast
    ? series
    : series.map(point => ({ ...point, afterUnlock: false, y: 0 }))

  const renderSummary = function () {
    if (hasForecast && systemState !== undefined) {
      return (
        <PayoutHeadline
          currentEpoch={systemState.currentEpoch}
          input={input}
          lockEnd={forecast.lockEnd}
          lockupDays={lockupDays}
          nextPayout={chartSeries[0]}
          price={price}
          symbol={token.symbol}
        />
      )
    }
    if (isError) {
      return (
        <div className="flex flex-col items-start gap-y-2">
          <span className="text-xs text-neutral-400">{t('load-failed')}</span>
          <Button
            onClick={() => refetch()}
            size="xSmall"
            type="button"
            variant="secondary"
          >
            {tCommon('try-again')}
          </Button>
        </div>
      )
    }
    if (isPending) {
      return <Skeleton className="h-6 w-40" />
    }
    return (
      <span className="text-xs text-neutral-400">
        {hasPot
          ? t('enter-minimum-amount', {
              amount: formatNumber(formatUnits(minLockAmount, token.decimals)),
              symbol: token.symbol,
            })
          : t('not-funded')}
      </span>
    )
  }

  return (
    <div className="flex w-full flex-col gap-y-4 rounded-lg border border-solid border-transparent bg-neutral-50 p-4 ring-1 ring-transparent hover:shadow-bs">
      {/* TODO #2368 bring back the advanced estimator button on this row, with
          its `advanced-estimator` label, once that page exists */}
      <span className={sectionLabelClassName}>{t('title')}</span>
      <div className="min-h-20">{renderSummary()}</div>
      <div className="flex w-full flex-col gap-y-1.5">
        <span className={sectionLabelClassName}>
          {systemState !== undefined &&
            t('starting-from-epoch', { epoch: systemState.currentEpoch })}
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
          isPending={isPending}
          series={chartSeries}
          ticks={getPayoutAxisTicks(chartSeries)}
          unlockX={getUnlockMarkerX(chartSeries)}
        />
      </div>
    </div>
  )
}
