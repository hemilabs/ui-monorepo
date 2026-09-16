import { useWindowSize } from '@hemilabs/react-hooks/useWindowSize'
import { Button } from 'components/button'
import Skeleton from 'react-loading-skeleton'
import { screenBreakpoints } from 'styles'
import { useLocale, useTranslations } from 'use-intl'
import { formatDate, formatShortDate } from 'utils/format'
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryStack,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory'

import { formatSupplyValue } from '../_utils/formatSupplyValue'
import { sliceColors } from '../_utils/sliceColors'
import {
  getPeriodDurationMs,
  sliceLabels,
  stackOrder,
  type ChartPoint,
  type SupplyPeriod,
  type SupplySlice,
  type SupplyUnit,
} from '../_utils/supplyHistory'

const tickLabelStyle = {
  fill: '#737373',
  fontFamily: 'Geist, sans-serif',
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: 0.22,
  lineHeight: '16px',
}

const xAxisStyle = {
  axis: { stroke: 'transparent' },
  tickLabels: tickLabelStyle,
}

const yAxisStyle = {
  ...xAxisStyle,
  grid: { stroke: '#E5E5E5', strokeDasharray: '4,4' },
}

const chartHeight = 180
// right leaves room for the last date label, which is centred on its tick
const chartPadding = { bottom: 24, left: 64, right: 16, top: 8 }

const fallbackChartWidth = 340

// The SVG scales to fill its container, so a smaller viewBox makes labels look
// larger. Widths are picked per breakpoint to keep tick labels a steady size.
const widthByBreakpoint: ReadonlyArray<[number, number]> = [
  [screenBreakpoints.xl, 900],
  [screenBreakpoints.lg, 700],
  [screenBreakpoints.md, 560],
]

const tooltipRowHeight = 12
const swatchSize = 7
const tooltipWidth = 186
const tooltipHeight = 5 * tooltipRowHeight + 12

const skeletonBarHeights = [46, 62, 54, 70, 58, 74, 64, 80, 68, 86, 76, 92]

const getPlaceholderXTicks = function (period: SupplyPeriod) {
  const now = Date.now()
  const duration = getPeriodDurationMs(period)
  return Array.from(
    { length: 4 },
    (_, index) => now - duration + (index * duration) / 3,
  )
}

type ActivePoint = ChartPoint & { childName?: string }

type TooltipProps = {
  activePoints?: ActivePoint[]
  formatValue: (value: number) => string
  locale: string
  rows: Record<SupplySlice, { color: string; label: string }>
  totalLabel: string
  x?: number
  y?: number
}

const supplySliceLines = (
  activePoints: ActivePoint[],
  rows: Record<SupplySlice, { color: string; label: string }>,
  formatValue: (value: number) => string,
) =>
  [...stackOrder]
    .reverse()
    .map(function (slice) {
      const point = activePoints.find(active => active.childName === slice)
      return point === undefined
        ? undefined
        : { ...rows[slice], value: formatValue(point.y) }
    })
    .filter(line => line !== undefined)

const SupplyTooltipLabel = function ({
  activePoints,
  formatValue,
  locale,
  rows,
  totalLabel,
  x = 0,
  y = 0,
}: TooltipProps) {
  if (!activePoints?.length) {
    return null
  }

  const left = x - tooltipWidth / 2 + 12
  const right = x + tooltipWidth / 2 - 12
  const top = y - tooltipHeight / 2 + 15.5

  // Matched on the series name rather than on position, so the swatch cannot
  // drift onto another slice's value.
  const lines = supplySliceLines(activePoints, rows, formatValue)
  const total = activePoints.reduce((sum, point) => sum + point.y, 0)

  return (
    <g style={{ fontFamily: 'Geist, sans-serif', fontSize: 9 }}>
      <text fill="#737373" fontWeight={500} x={left} y={top}>
        {formatDate(new Date(activePoints[0].x), locale, 'UTC')}
      </text>
      {lines.map((line, index) => (
        <g key={line.label}>
          <rect
            fill={line.color}
            height={swatchSize}
            rx={2}
            width={swatchSize}
            x={left}
            y={top + (index + 1) * tooltipRowHeight - swatchSize + 1}
          />
          <text
            fill="#737373"
            x={left + swatchSize + 5}
            y={top + (index + 1) * tooltipRowHeight}
          >
            {line.label}
          </text>
          <text
            fill="#0a0a0a"
            textAnchor="end"
            x={right}
            y={top + (index + 1) * tooltipRowHeight}
          >
            {line.value}
          </text>
        </g>
      ))}
      <text
        fill="#0a0a0a"
        fontWeight={600}
        x={left}
        y={top + 4 * tooltipRowHeight}
      >
        {totalLabel}
      </text>
      <text
        fill="#0a0a0a"
        fontWeight={600}
        textAnchor="end"
        x={right}
        y={top + 4 * tooltipRowHeight}
      >
        {formatValue(total)}
      </text>
    </g>
  )
}

type Props = {
  isPending: boolean
  onRetry: VoidFunction
  period: SupplyPeriod
  series: Record<SupplySlice, ChartPoint[]> | undefined
  symbol: string
  unit: SupplyUnit
}

export const SupplyChart = function ({
  isPending,
  onRetry,
  period,
  series,
  symbol,
  unit,
}: Props) {
  const locale = useLocale()
  const t = useTranslations('hemi-stake.analytics')
  const tCommon = useTranslations('common')
  const { width: windowWidth } = useWindowSize()
  const chartWidth =
    widthByBreakpoint.find(([minWidth]) => windowWidth >= minWidth)?.[1] ??
    fallbackChartWidth

  const formatValue = (value: number) =>
    formatSupplyValue({ locale, symbol, unit, value })

  const formatTooltipValue = (value: number) =>
    formatSupplyValue({ locale, precision: 'full', symbol, unit, value })

  const rows = Object.fromEntries(
    stackOrder.map(slice => [
      slice,
      { color: sliceColors[slice], label: t(sliceLabels[slice]) },
    ]),
  ) as Record<SupplySlice, { color: string; label: string }>

  if (series !== undefined && series.staked.length > 0) {
    // A bar takes up its whole slot, so the first and last ones need half a
    // slot of room or they spill over the axis and its labels.
    const halfSlot =
      (chartWidth - chartPadding.left - chartPadding.right) /
      (2 * series.staked.length)

    return (
      <VictoryChart
        containerComponent={
          <VictoryVoronoiContainer
            labelComponent={
              <VictoryTooltip
                constrainToVisibleArea
                cornerRadius={8}
                flyoutHeight={tooltipHeight}
                flyoutStyle={{ fill: 'white', stroke: '#E5E5E5' }}
                flyoutWidth={tooltipWidth}
                labelComponent={
                  <SupplyTooltipLabel
                    formatValue={formatTooltipValue}
                    locale={locale}
                    rows={rows}
                    totalLabel={t('total')}
                  />
                }
                pointerLength={0}
              />
            }
            labels={() => ' '}
            voronoiDimension="x"
          />
        }
        domainPadding={{ x: halfSlot }}
        height={chartHeight}
        padding={chartPadding}
        width={chartWidth}
      >
        <VictoryAxis
          style={xAxisStyle}
          tickCount={4}
          tickFormat={(tick: number) =>
            formatShortDate(new Date(tick), locale, 'UTC')
          }
        />
        <VictoryAxis
          dependentAxis
          style={yAxisStyle}
          tickFormat={formatValue}
        />
        <VictoryStack>
          {stackOrder.map(slice => (
            <VictoryBar
              barRatio={0.9}
              data={series[slice]}
              key={slice}
              name={slice}
              style={{ data: { fill: sliceColors[slice] } }}
            />
          ))}
        </VictoryStack>
      </VictoryChart>
    )
  }

  const emptyChart = (
    <VictoryChart
      height={chartHeight}
      padding={chartPadding}
      width={chartWidth}
    >
      <VictoryAxis
        style={xAxisStyle}
        tickFormat={(tick: number) =>
          formatShortDate(new Date(tick), locale, 'UTC')
        }
        tickValues={getPlaceholderXTicks(period)}
      />
      <VictoryAxis dependentAxis style={yAxisStyle} tickFormat={() => ''} />
    </VictoryChart>
  )

  const plotArea = {
    bottom: `${(chartPadding.bottom / chartHeight) * 100}%`,
    left: `${(chartPadding.left / chartWidth) * 100}%`,
    right: `${(chartPadding.right / chartWidth) * 100}%`,
    top: `${(chartPadding.top / chartHeight) * 100}%`,
  }

  if (isPending) {
    return (
      <div className="relative">
        {emptyChart}
        <div className="absolute flex items-end gap-[2%]" style={plotArea}>
          {skeletonBarHeights.map(height => (
            <div
              className="flex-1"
              key={height}
              style={{ height: `${height}%` }}
            >
              <Skeleton height="100%" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="opacity-30">{emptyChart}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Button
          onClick={onRetry}
          size="xSmall"
          type="button"
          variant="secondary"
        >
          {tCommon('try-again')}
        </Button>
      </div>
    </div>
  )
}
