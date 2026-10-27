import { Button } from 'components/button'
import { Card } from 'components/card'
import {
  SegmentedControl,
  type SegmentedControlOption,
} from 'components/segmentedControl'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { type ReactNode, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { screenBreakpoints } from 'styles'
import { useLocale, useTranslations } from 'use-intl'
import {
  formatCompactFiat,
  formatCompactFiatParts,
  formatFiatAmount,
  formatNumber,
  formatShortDate,
  formatShortDateWithYear,
} from 'utils/format'
import { getTokenPrice } from 'utils/token'

import {
  PayoutsChart,
  stackedBelowColor,
  payoutsColor,
} from '../../_components/payoutsChart'
import { type ChartWidths } from '../../_hooks/useChartWidth'
import { type ChartPoint } from '../../_utils/chartPoint'
import { type ChartUnit } from '../../_utils/chartUnit'
import {
  formatPayoutDetail,
  formatPayoutValue,
} from '../../_utils/formatPayoutValue'
import {
  type PayoutPoint,
  getPayoutAxisTicks,
  getUnlockMarkerX,
  toZeroedSeries,
} from '../../_utils/payoutsChartData'
import { toPrice } from '../../_utils/toPrice'
import {
  type ProjectionEpoch,
  toPayoutBars,
  toVotingPowerCurve,
} from '../_utils/projectionSeries'

import { VotingPowerChart } from './votingPowerChart'

const axisTickCount = 5

const columnWidths: ChartWidths = {
  breakpoints: [
    [screenBreakpoints.xl, 620],
    [screenBreakpoints.lg, 420],
    [screenBreakpoints.md, 560],
  ],
  fallback: 300,
}

const toShown = function ({
  existingBars,
  hasNewPosition,
  incomingBars,
  isBlended,
  isReady,
  labels,
  locale,
  unlocksOn,
  votingPower,
}: {
  existingBars: ChartPoint[]
  hasNewPosition: boolean
  incomingBars: PayoutPoint[]
  isBlended: boolean
  isReady: boolean
  labels: { below: string; series: string; total: string }
  locale: string
  unlocksOn: string
  votingPower: ChartPoint[]
}) {
  if (!isReady) {
    return {
      below: undefined,
      headline: undefined,
      payouts: toZeroedSeries(incomingBars),
      unlocksOn: undefined,
      unlockX: undefined,
      weights: votingPower.map(point => ({ ...point, y: 0 })),
    }
  }

  return {
    below: isBlended
      ? {
          label: labels.below,
          points: existingBars,
          seriesLabel: labels.series,
          totalLabel: labels.total,
        }
      : undefined,
    headline: formatNumber(
      votingPower.length > 0 ? votingPower[0].y : 0,
      locale,
    ),
    payouts: incomingBars,
    unlocksOn: hasNewPosition ? unlocksOn : undefined,
    unlockX: hasNewPosition ? getUnlockMarkerX(incomingBars) : undefined,
    weights: votingPower,
  }
}

const HeadingLabel = function ({
  className,
  isError,
  label,
}: {
  className: string
  isError: boolean
  label: string | undefined
}) {
  if (label !== undefined) {
    return <>{label}</>
  }
  return isError ? <>-</> : <Skeleton className={className} />
}

const RetryOverlay = function ({
  children,
  message,
  onRetry,
  tryAgain,
}: {
  children: ReactNode
  message: string
  onRetry: VoidFunction | undefined
  tryAgain: string
}) {
  if (onRetry === undefined) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div className="opacity-30">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-2">
        <span className="text-xs text-neutral-400">{message}</span>
        <Button
          onClick={onRetry}
          size="xSmall"
          type="button"
          variant="secondary"
        >
          {tryAgain}
        </Button>
      </div>
    </div>
  )
}

const UnitToggle = function ({
  label,
  onChange,
  options,
  price,
  value,
}: {
  label: string
  onChange: (unit: ChartUnit) => void
  options: SegmentedControlOption<ChartUnit>[]
  price: number | undefined
  value: ChartUnit
}) {
  if (price === undefined) {
    return null
  }
  return (
    <SegmentedControl
      label={label}
      onChange={onChange}
      options={options}
      value={value}
    />
  )
}

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-x-1.5">
    <span className="size-2 rounded-sm" style={{ backgroundColor: color }} />
    <span>{label}</span>
  </div>
)

type Props = {
  blended: ProjectionEpoch[]
  currentEpoch: number | undefined
  existing: ProjectionEpoch[]
  incoming: ProjectionEpoch[]
  isBlended: boolean
  isError: boolean
  isLoading: boolean
  lockEnd: number
  onRetry: VoidFunction | undefined
}

export const ProjectionsCard = function ({
  blended,
  currentEpoch,
  existing,
  incoming,
  isBlended,
  isError,
  isLoading,
  lockEnd,
  onRetry,
}: Props) {
  const [unit, setUnit] = useState<ChartUnit>('hemi')
  const locale = useLocale()
  const t = useTranslations('hemi-stake')
  const tCommon = useTranslations('common')
  const token = useHemiToken()
  const { data: prices } = useTokenPrices()

  const price = toPrice(getTokenPrice(token, prices))
  const activeUnit = price === undefined ? 'hemi' : unit
  const symbol = activeUnit === 'usd' ? 'USD' : token.symbol

  const toBars = (payouts: ProjectionEpoch[]) =>
    toPayoutBars({
      decimals: token.decimals,
      lockEnd,
      payouts,
      unit: activeUnit,
      usdPrice: price,
    })

  const incomingBars = toBars(incoming)
  const votingPower = toVotingPowerCurve({
    decimals: token.decimals,
    payouts: blended,
  })

  const ticks = getPayoutAxisTicks(incomingBars, axisTickCount)
  const formatDate = (value: number) => formatShortDate(new Date(value), locale)
  const formatPayout = (value: number) =>
    activeUnit === 'usd'
      ? formatCompactFiat(value, locale, 2)
      : formatPayoutValue({ symbol: token.symbol, value })
  const formatDetail = (value: number) =>
    activeUnit === 'usd'
      ? formatFiatAmount(value)
      : formatPayoutDetail({ price, symbol: token.symbol, value })
  const formatWeight = function (value: number) {
    const { number, suffix } = formatCompactFiatParts(value, locale)
    return `${number}${suffix}`
  }

  const unitOptions: SegmentedControlOption<ChartUnit>[] = [
    { label: token.symbol, value: 'hemi' },
    { label: 'USD', value: 'usd' },
  ]

  const isPending = isLoading && !isError
  const shown = toShown({
    existingBars: toBars(existing).map(({ x, y }) => ({ x, y })),
    hasNewPosition: incoming.some(epoch => epoch.weight > BigInt(0)),
    incomingBars,
    isBlended,
    isReady: !isError && !isPending,
    labels: {
      below: t('estimator.my-positions'),
      series: t('estimator.new-position'),
      total: t('estimated-payouts.title'),
    },
    locale,
    unlocksOn: t('estimated-payouts.unlocks-on', {
      date: formatShortDateWithYear(new Date(lockEnd * 1000), locale),
    }),
    votingPower,
  })

  return (
    <Card shadow="sm">
      <RetryOverlay
        message={t('estimated-payouts.load-failed')}
        onRetry={onRetry}
        tryAgain={tCommon('try-again')}
      >
        <div className="flex w-full flex-col gap-y-6 p-4">
          <div className="flex flex-col gap-y-3">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <span className="body-text-medium text-neutral-500">
                <HeadingLabel
                  className="w-48"
                  isError={isError}
                  label={
                    currentEpoch === undefined
                      ? undefined
                      : t('estimator.per-epoch', {
                          epoch: String(currentEpoch),
                          symbol,
                        })
                  }
                />
              </span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {shown.unlocksOn !== undefined && (
                  <span className="body-text-caption text-neutral-400">
                    {shown.unlocksOn}
                  </span>
                )}
                <UnitToggle
                  label={t('estimator.unit')}
                  onChange={setUnit}
                  options={unitOptions}
                  price={price}
                  value={unit}
                />
              </div>
            </div>
            <PayoutsChart
              afterUnlockLabel={t('estimated-payouts.after-unlock')}
              below={shown.below}
              formatDate={formatDate}
              formatDetail={formatDetail}
              formatValue={formatPayout}
              height={150}
              isPending={isPending}
              series={shown.payouts}
              ticks={ticks}
              unlockX={shown.unlockX}
              widths={columnWidths}
            />
            {shown.below !== undefined && (
              <div className="body-text-caption flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-500">
                <LegendItem
                  color={payoutsColor}
                  label={t('estimator.new-position')}
                />
                <LegendItem
                  color={stackedBelowColor}
                  label={t('estimator.my-positions')}
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-y-3">
            <span className="body-text-medium text-neutral-500">
              {t.rich('estimator.voting-power-title', {
                amount: () => (
                  <HeadingLabel
                    className="w-16"
                    isError={isError}
                    label={shown.headline}
                  />
                ),
              })}
            </span>
            <VotingPowerChart
              formatDate={formatDate}
              formatValue={formatWeight}
              isPending={isPending}
              series={shown.weights}
              ticks={ticks}
              unlockX={shown.unlockX}
              widths={columnWidths}
            />
          </div>
        </div>
      </RetryOverlay>
    </Card>
  )
}
