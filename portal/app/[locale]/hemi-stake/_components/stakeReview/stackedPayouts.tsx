import { useFormat } from 'hooks/useFormat'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { screenBreakpoints } from 'styles'
import { useTranslations } from 'use-intl'
import { getTokenPrice } from 'utils/token'
import { formatUnits } from 'viem'

import { type ChartWidths } from '../../_hooks/useChartWidth'
import { type usePositionForecastInputs } from '../../_hooks/usePositionForecastInputs'
import {
  formatPayoutDetail,
  formatPayoutValue,
} from '../../_utils/formatPayoutValue'
import {
  getPayoutAxisTicks,
  getUnlockMarkerX,
  toPayoutSeries,
  toZeroedSeries,
} from '../../_utils/payoutsChartData'
import { toPrice } from '../../_utils/toPrice'
import { PayoutHeadline } from '../estimatedPayouts/payoutHeadline'
import { PayoutPlaceholder } from '../estimatedPayouts/payoutPlaceholder'
import { PayoutsCard } from '../estimatedPayouts/payoutsCard'
import {
  LegendItem,
  PayoutsChart,
  payoutsColor,
  stackedBelowColor,
} from '../payoutsChart'

type Leg = {
  payouts: { payout: bigint; timestamp: number }[]
  yearOneTotal: bigint
}

type StackedForecast = {
  blended: {
    lockEnd: number
    yearOneReturnRatio: number
    yearOneTotal: bigint
  }
  daysUntilUnlock: number
  existing: Leg
  incoming: Leg
  nextPayout: bigint
  paysInFirstYear: boolean
  totalAmount: bigint
}

type Props = Pick<
  ReturnType<typeof usePositionForecastInputs>,
  | 'carriedFrom'
  | 'currentEpoch'
  | 'isError'
  | 'isMissingPosition'
  | 'isPending'
  | 'retry'
> & {
  addedLabel: string
  earnsAnotherEpoch: boolean | undefined
  forecast: StackedForecast | undefined
  hasValidLockup: boolean
  lockEnd: number | undefined
  tooltipId: string
}

const drawerWidths: ChartWidths = {
  breakpoints: [[screenBreakpoints.md, 400]],
  fallback: 320,
}

const flatten = <Point extends { y: number }>(points: Point[]) =>
  points.map(point => ({ ...point, y: 0 }))

const StackedChart = function ({
  addedLabel,
  forecast,
  isPending,
}: {
  addedLabel: string
  forecast: StackedForecast | undefined
  isPending: boolean
}) {
  const formatter = useFormat()
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
        seriesLabel: addedLabel,
        totalLabel: t('title'),
      }}
      formatDate={value => formatter.formatShortDate(new Date(value))}
      formatDetail={value =>
        formatPayoutDetail({ formatter, price, symbol: token.symbol, value })
      }
      formatValue={value =>
        formatPayoutValue({ formatter, symbol: token.symbol, value })
      }
      isPending={isPending}
      series={series}
      ticks={getPayoutAxisTicks(series)}
      unlockX={getUnlockMarkerX(series)}
      widths={drawerWidths}
    />
  )
}

export const StackedPayouts = function ({
  addedLabel,
  carriedFrom,
  currentEpoch,
  earnsAnotherEpoch,
  forecast,
  hasValidLockup,
  isError,
  isMissingPosition,
  isPending,
  lockEnd,
  retry,
  tooltipId,
}: Props) {
  const t = useTranslations('hemi-stake.estimated-payouts')
  const token = useHemiToken()

  if (isMissingPosition || earnsAnotherEpoch === false) {
    return null
  }

  const chart = (
    <StackedChart
      addedLabel={addedLabel}
      forecast={forecast}
      isPending={isPending && !isError}
    />
  )
  const footer = (
    <div className="body-text-caption flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-500">
      <LegendItem color={payoutsColor} label={addedLabel} />
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
            tooltipId={tooltipId}
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
          hasValidLockup={hasValidLockup}
          isPending={isPending}
          lockEnd={lockEnd ?? 0}
          meetsMinimumAmount
          onRetry={retry}
        />
      }
    />
  )
}
