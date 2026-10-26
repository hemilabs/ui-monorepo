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
import {
  formatPayoutDetail,
  formatPayoutValue,
} from '../../_utils/formatPayoutValue'
import {
  type PayoutPoint,
  getPayoutAxisTicks,
  getUnlockMarkerX,
} from '../../_utils/payoutsChartData'
import { toPrice } from '../../_utils/toPrice'
import {
  type ProjectionUnit,
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

const zeroed = (series: PayoutPoint[]) =>
  series.map(point => ({ ...point, afterUnlock: false, y: 0 }))

type ProjectionEpoch = {
  payout: bigint
  timestamp: number
  weight: bigint
}

const EpochHeading = function ({
  isError,
  label,
}: {
  isError: boolean
  label: string | undefined
}) {
  if (label !== undefined) {
    return <>{label}</>
  }
  return isError ? <>-</> : <Skeleton className="w-48" />
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
  onChange: (unit: ProjectionUnit) => void
  options: SegmentedControlOption<ProjectionUnit>[]
  price: number | undefined
  value: ProjectionUnit
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
  const [unit, setUnit] = useState<ProjectionUnit>('hemi')
  const locale = useLocale()
  const t = useTranslations('hemi-stake.estimator')
  const tCommon = useTranslations('common')
  const tPayouts = useTranslations('hemi-stake.estimated-payouts')
  const token = useHemiToken()
  const { data: prices } = useTokenPrices()

  const price = toPrice(getTokenPrice(token, prices))
  const activeUnit = price === undefined ? 'hemi' : unit
  const symbol = activeUnit === 'usd' ? 'USD' : token.symbol

  const toBars = (payouts: ProjectionEpoch[], unlocksAt: number) =>
    toPayoutBars({
      decimals: token.decimals,
      lockEnd: unlocksAt,
      payouts,
      unit: activeUnit,
      usdPrice: price,
    })

  const incomingBars = toBars(incoming, lockEnd)
  const existingBars = toBars(existing, Number.MAX_SAFE_INTEGER)
  const votingPower = toVotingPowerCurve({
    decimals: token.decimals,
    lockEnd,
    payouts: blended,
  })

  const ticks = getPayoutAxisTicks(incomingBars, axisTickCount)
  const unlockX = getUnlockMarkerX(incomingBars)
  const formatDate = (value: number) => formatShortDate(new Date(value), locale)
  const formatPayout = (value: number) =>
    activeUnit === 'usd'
      ? formatCompactFiat(value, locale, 2)
      : formatPayoutValue({ symbol: token.symbol, value })
  const formatWeight = function (value: number) {
    const { number, suffix } = formatCompactFiatParts(value, locale)
    return `${number}${suffix}`
  }

  const unitOptions: SegmentedControlOption<ProjectionUnit>[] = [
    { label: token.symbol, value: 'hemi' },
    { label: 'USD', value: 'usd' },
  ]

  const isPending = isLoading && !isError
  const headlineWeight = votingPower.length > 0 ? votingPower[0].y : 0

  const shown = isError
    ? {
        below: undefined,
        headline: '-',
        payouts: zeroed(incomingBars),
        unlockX: undefined,
        weights: zeroed(votingPower),
      }
    : {
        below: isBlended
          ? {
              label: t('my-positions'),
              points: existingBars,
              seriesLabel: t('new-position'),
              totalLabel: tPayouts('title'),
            }
          : undefined,
        headline: formatNumber(headlineWeight, locale),
        payouts: incomingBars,
        unlockX,
        weights: votingPower,
      }

  return (
    <Card shadow="sm">
      <RetryOverlay
        message={tPayouts('load-failed')}
        onRetry={onRetry}
        tryAgain={tCommon('try-again')}
      >
        <div className="flex w-full flex-col gap-y-6 p-4">
          <div className="flex flex-col gap-y-3">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <span className="body-text-medium text-neutral-500">
                <EpochHeading
                  isError={isError}
                  label={
                    currentEpoch === undefined
                      ? undefined
                      : t('per-epoch', { epoch: String(currentEpoch), symbol })
                  }
                />
              </span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="body-text-caption text-neutral-400">
                  {tPayouts('unlocks-on', {
                    date: formatShortDateWithYear(
                      new Date(lockEnd * 1000),
                      locale,
                    ),
                  })}
                </span>
                <UnitToggle
                  label={t('unit')}
                  onChange={setUnit}
                  options={unitOptions}
                  price={price}
                  value={unit}
                />
              </div>
            </div>
            <PayoutsChart
              below={shown.below}
              formatDate={formatDate}
              formatDetail={point =>
                point.afterUnlock
                  ? tPayouts('after-unlock')
                  : formatPayoutDetail({
                      price: activeUnit === 'usd' ? undefined : price,
                      symbol,
                      value: point.y,
                    })
              }
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
                <LegendItem color={payoutsColor} label={t('new-position')} />
                <LegendItem
                  color={stackedBelowColor}
                  label={t('my-positions')}
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-y-3">
            <span className="body-text-medium text-neutral-500">
              {t('voting-power-title', {
                amount: shown.headline,
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
