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

import { useChartWidth } from '../_hooks/useChartWidth'
import {
  chartHeight,
  chartPadding,
  getHalfSlot,
  xAxisStyle,
  yAxisStyle,
} from '../_utils/chartLayout'
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

import { ChartPlaceholder } from './chartPlaceholder'
import {
  ChartTooltipLabel,
  getTooltipHeight,
  tooltipWidth,
} from './chartTooltipLabel'

const tooltipHeight = getTooltipHeight({
  hasNote: false,
  lineCount: stackOrder.length,
})

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

  // Matched on the series name rather than on position, so the swatch cannot
  // drift onto another slice's value.
  const lines = supplySliceLines(activePoints, rows, formatValue)
  const total = activePoints.reduce((sum, point) => sum + point.y, 0)

  return (
    <ChartTooltipLabel
      lines={lines}
      title={formatDate(new Date(activePoints[0].x), locale, 'UTC')}
      total={formatValue(total)}
      totalLabel={totalLabel}
      x={x}
      y={y}
    />
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
  const chartWidth = useChartWidth()

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
    const halfSlot = getHalfSlot({
      barCount: series.staked.length,
      chartWidth,
    })

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

  return (
    <ChartPlaceholder
      chartWidth={chartWidth}
      isPending={isPending}
      onRetry={onRetry}
      xTickFormat={(tick: number) =>
        formatShortDate(new Date(tick), locale, 'UTC')
      }
      xTicks={getPlaceholderXTicks(period)}
    />
  )
}
