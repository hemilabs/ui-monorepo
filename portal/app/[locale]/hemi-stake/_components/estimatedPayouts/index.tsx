import { ButtonLink } from 'components/button'
import { Chevron } from 'components/icons/chevron'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { useLocale, useTranslations } from 'use-intl'
import { formatShortDate } from 'utils/format'
import { unixNowTimestamp } from 'utils/time'
import { getTokenPrice, parseTokenUnits } from 'utils/token'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useEpochSystemState } from '../../_hooks/useEpochSystemState'
import { useRewardsForecastInputs } from '../../_hooks/useRewardsForecastInputs'
import {
  formatPayoutDetail,
  formatPayoutValue,
} from '../../_utils/formatPayoutValue'
import { wholeDaysToSeconds } from '../../_utils/lockCreationTimes'
import { isValidLockup } from '../../_utils/lockupError'
import {
  getPayoutAxisTicks,
  getUnlockMarkerX,
  toPayoutSeries,
  toZeroedSeries,
} from '../../_utils/payoutsChartData'
import {
  emptyInputsByClass,
  type InputsByClass,
} from '../../_utils/rewardClass'
import { getRewardsForecast } from '../../_utils/stakeRewardsForecast'
import { toPrice } from '../../_utils/toPrice'
import { PayoutsChart } from '../payoutsChart'

import { PayoutHeadline } from './payoutHeadline'
import { PayoutPlaceholder } from './payoutPlaceholder'
import { PayoutsCard } from './payoutsCard'

const buildForecast = function ({
  amount,
  decimals,
  hasValidLockup,
  inputsByClass,
  lockupDays,
}: {
  amount: bigint
  decimals: number
  hasValidLockup: boolean
  inputsByClass: InputsByClass
  lockupDays: number
}) {
  const forecast = getRewardsForecast({
    amount,
    inputsByClass,
    lockDurationInSeconds: Number(wholeDaysToSeconds(lockupDays)),
    now: Number(unixNowTimestamp()),
  })
  const series = toPayoutSeries({
    decimals,
    lockEnd: forecast.lockEnd,
    payouts: forecast.payouts,
  })
  const hasForecast =
    (inputsByClass.transferable.baseline ?? BigInt(0)) > BigInt(0) &&
    forecast.meetsMinimumAmount &&
    hasValidLockup

  return {
    chartSeries: hasForecast ? series : toZeroedSeries(series),
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
  const inputsByClass = forecastInputs ?? emptyInputsByClass

  const hasValidLockup = isValidLockup({ value: lockupDays })
  const hasError = isSystemStateError || isForecastError
  const retry = isSystemStateError ? refetchSystemState : refetchForecast
  const price = toPrice(getTokenPrice(token, prices))

  const { chartSeries, forecast, hasForecast } = buildForecast({
    amount,
    decimals: token.decimals,
    hasValidLockup,
    inputsByClass,
    lockupDays,
  })

  return (
    <PayoutsCard
      action={
        <div className="group">
          <ButtonLink
            href="/hemi-stake/estimator"
            size="xSmall"
            variant="tertiary"
          >
            {t('advanced-estimator')}
            <Chevron.Right className="[&>path]:fill-neutral-500 group-hover:[&>path]:fill-neutral-950" />
          </ButtonLink>
        </div>
      }
      chart={
        <PayoutsChart
          afterUnlockLabel={t('after-unlock')}
          formatDate={value => formatShortDate(new Date(value), locale)}
          formatDetail={value =>
            formatPayoutDetail({ price, symbol: token.symbol, value })
          }
          formatValue={value =>
            formatPayoutValue({ symbol: token.symbol, value })
          }
          isPending={isPending && !hasError && forecast.meetsMinimumAmount}
          series={chartSeries}
          ticks={getPayoutAxisTicks(chartSeries)}
          unlockX={getUnlockMarkerX(chartSeries)}
        />
      }
      currentEpoch={systemState?.currentEpoch}
      headline={
        hasForecast && systemState !== undefined ? (
          <PayoutHeadline
            carriedFrom={forecastInputs?.transferable.carriedFrom}
            currentEpoch={systemState.currentEpoch}
            input={input}
            lockEnd={forecast.lockEnd}
            lockupDays={lockupDays}
            nextPayout={forecast.payouts[0].payout}
            nextPayoutAt={forecast.payouts[0].timestamp}
            tooltipId="estimated-payouts-apy"
            yearOneReturnRatio={forecast.yearOneReturnRatio}
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
        )
      }
    />
  )
}
