import { useHemiToken } from 'hooks/useHemiToken'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { screenBreakpoints } from 'styles'
import { useLocale, useTranslations } from 'use-intl'
import { formatShortDate } from 'utils/format'
import { getTokenPrice, parseTokenUnits } from 'utils/token'
import { formatUnits } from 'viem'

import { useStakingDashboard } from '../../../_context/stakingDashboardContext'
import { type ChartWidths } from '../../../_hooks/useChartWidth'
import { useTopUpForecast } from '../../../_hooks/useTopUpForecast'
import {
  formatPayoutDetail,
  formatPayoutValue,
} from '../../../_utils/formatPayoutValue'
import {
  getPayoutAxisTicks,
  getUnlockMarkerX,
  toPayoutSeries,
  toZeroedSeries,
} from '../../../_utils/payoutsChartData'
import { toPrice } from '../../../_utils/toPrice'
import { type getTopUpForecast } from '../../../_utils/topUpForecast'
import { PayoutHeadline } from '../../estimatedPayouts/payoutHeadline'
import { PayoutPlaceholder } from '../../estimatedPayouts/payoutPlaceholder'
import { PayoutsCard } from '../../estimatedPayouts/payoutsCard'
import {
  LegendItem,
  PayoutsChart,
  payoutsColor,
  stackedBelowColor,
} from '../../payoutsChart'

type TopUpForecast = ReturnType<typeof getTopUpForecast>

const drawerWidths: ChartWidths = {
  breakpoints: [[screenBreakpoints.md, 400]],
  fallback: 320,
}

const flatten = <Point extends { y: number }>(points: Point[]) =>
  points.map(point => ({ ...point, y: 0 }))

const TopUpChart = function ({
  forecast,
  isPending,
}: {
  forecast: TopUpForecast | undefined
  isPending: boolean
}) {
  const locale = useLocale()
  const t = useTranslations('hemi-stake.estimated-payouts')
  const token = useHemiToken()
  const { data: prices } = useTokenPrices()

  const price = toPrice(getTokenPrice(token, prices))
  const toSeries = (payouts: { payout: bigint; timestamp: number }[]) =>
    toPayoutSeries({
      decimals: token.decimals,
      lockEnd: forecast?.blended.lockEnd ?? 0,
      payouts,
    })

  const pays = forecast?.paysInFirstYear === true
  const added =
    forecast === undefined ? [] : toSeries(forecast.incoming.payouts)
  const existing =
    forecast === undefined
      ? []
      : toSeries(forecast.existing.payouts).map(({ x, y }) => ({ x, y }))
  const series = pays ? added : toZeroedSeries(added)

  return (
    <PayoutsChart
      afterUnlockLabel={t('after-unlock')}
      below={{
        label: t('this-lockup'),
        points: pays ? existing : flatten(existing),
        seriesLabel: t('added-amount', { symbol: token.symbol }),
        totalLabel: t('title'),
      }}
      formatDate={value => formatShortDate(new Date(value), locale)}
      formatDetail={value =>
        formatPayoutDetail({ price, symbol: token.symbol, value })
      }
      formatValue={value => formatPayoutValue({ symbol: token.symbol, value })}
      isPending={isPending}
      series={series}
      ticks={getPayoutAxisTicks(series)}
      unlockX={getUnlockMarkerX(series)}
      widths={drawerWidths}
    />
  )
}

const TopUpForecastCard = function ({
  addedAmount,
  tokenId,
}: {
  addedAmount: bigint
  tokenId: bigint | undefined
}) {
  const t = useTranslations('hemi-stake.estimated-payouts')
  const token = useHemiToken()
  const {
    carriedFrom,
    currentEpoch,
    earnsAnotherEpoch,
    forecast,
    isError,
    isMissingPosition,
    isPending,
    lockEnd,
    retry,
  } = useTopUpForecast({ addedAmount, tokenId })

  if (isMissingPosition || earnsAnotherEpoch === false) {
    return null
  }

  const chart = (
    <TopUpChart forecast={forecast} isPending={isPending && !isError} />
  )
  const footer = (
    <div className="body-text-caption flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-500">
      <LegendItem
        color={payoutsColor}
        label={t('added-amount', { symbol: token.symbol })}
      />
      <LegendItem color={stackedBelowColor} label={t('this-lockup')} />
    </div>
  )

  if (forecast?.paysInFirstYear === true && currentEpoch !== undefined) {
    return (
      <PayoutsCard
        chart={chart}
        currentEpoch={currentEpoch}
        footer={footer}
        headline={
          <PayoutHeadline
            carriedFrom={carriedFrom}
            currentEpoch={currentEpoch}
            input={formatUnits(forecast.totalAmount, token.decimals)}
            lockEnd={forecast.blended.lockEnd}
            lockupDays={forecast.daysUntilUnlock}
            nextPayout={forecast.nextPayout}
            nextPayoutAt={forecast.existing.payouts[0].timestamp}
            tooltipId="top-up-payouts-apy"
            yearOneReturnRatio={forecast.blended.yearOneReturnRatio}
            yearOneTotal={forecast.blended.yearOneTotal}
          />
        }
      />
    )
  }

  return (
    <PayoutsCard
      chart={chart}
      currentEpoch={currentEpoch}
      footer={footer}
      headline={
        <PayoutPlaceholder
          hasError={isError}
          hasValidLockup={lockEnd !== undefined}
          isPending={isPending}
          lockEnd={lockEnd ?? 0}
          meetsMinimumAmount
          onRetry={retry}
        />
      }
    />
  )
}

export const TopUpPayouts = function () {
  const token = useHemiToken()
  const { stakingDashboardOperation } = useStakingDashboard()

  return (
    <TopUpForecastCard
      addedAmount={parseTokenUnits(
        stakingDashboardOperation?.input ?? '0',
        token,
      )}
      tokenId={stakingDashboardOperation?.stakingPosition?.tokenId}
    />
  )
}
