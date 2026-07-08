'use client'

import { useWindowSize } from '@hemilabs/react-hooks/useWindowSize'
import { useLocale } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { screenBreakpoints } from 'styles'
import { EvmToken } from 'types/token'
import {
  formatCompactFiatParts,
  formatDate,
  formatPercentage,
  formatShortDate,
} from 'utils/format'
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory'

import {
  type MetricDataPoint,
  type MetricPeriod,
  type MetricType,
} from '../../../../types'

const getChartPadding = (metricType: MetricType) => ({
  bottom: 24,
  // deposits labels carry the token symbol (and es/pt add a space in compact
  // notation), so reserve more left room than the short APY "4%".
  left: metricType === 'apy' ? 28 : 80,
  right: 0,
  top: 4,
})

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

const AreaGradient = () => (
  <defs>
    <linearGradient id="hemi-area-gradient" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stopColor="#FFF0E8" />
      <stop offset="100%" stopColor="#FFF0E8" stopOpacity={0} />
    </linearGradient>
  </defs>
)

const periodDurations: Record<MetricPeriod, number> = {
  '1m': 30 * 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1y': 365 * 24 * 60 * 60 * 1000,
  '3m': 90 * 24 * 60 * 60 * 1000,
}

const getPlaceholderXTicks = function (period: MetricPeriod) {
  const now = Date.now()
  const duration = periodDurations[period]
  return Array.from(
    { length: 4 },
    (_, i) => now - duration + (i * duration) / 3,
  )
}

const formatShortTimestamp = (timestampMs: number, locale: string) =>
  formatShortDate(new Date(timestampMs), locale, 'UTC')

const formatFullTimestamp = (timestampMs: number, locale: string) =>
  formatDate(new Date(timestampMs), locale, 'UTC')

// compact = rounded axis ticks ("4%"); full = precise tooltip value ("4.53%").
type FormatPrecision = 'compact' | 'full'

const formatYAxis = function ({
  locale,
  metricType,
  peggedToken,
  precision = 'compact',
  value,
}: {
  locale: string
  metricType: MetricType
  peggedToken: EvmToken
  precision?: FormatPrecision
  value: number
}) {
  if (metricType === 'apy') {
    return precision === 'full'
      ? formatPercentage(value)
      : `${Math.round(value)}%`
  }
  const { number, suffix } = formatCompactFiatParts(value, locale)
  return `${number}${suffix} ${peggedToken.symbol}`
}

function ChartTooltipLabel({
  datum,
  locale,
  metricType,
  peggedToken,
  x,
  y,
}: {
  datum?: MetricDataPoint
  locale: string
  metricType: MetricType
  peggedToken: EvmToken
  x?: number
  y?: number
}) {
  if (datum === undefined) {
    return null
  }

  const dateText = formatFullTimestamp(datum.x, locale)
  const valueText = formatYAxis({
    locale,
    metricType,
    peggedToken,
    precision: 'full',
    value: datum.y,
  })

  return (
    <text
      dominantBaseline="central"
      style={{ fontSize: 9 }}
      textAnchor="middle"
      x={x}
      y={y}
    >
      <tspan fill="#737373">{dateText}</tspan>
      <tspan dx={4} fill="#0a0a0a">
        {valueText}
      </tspan>
    </text>
  )
}

const chartHeight = 130

// The SVG scales to fill its container, so a smaller viewBox width makes labels appear
// larger. Pick widths per breakpoint (largest first) so tick labels stay a consistent visual size.
const chartWidthByBreakpoint: ReadonlyArray<[number, number]> = [
  [screenBreakpoints.xl, 680],
  [screenBreakpoints.lg, 520],
  [screenBreakpoints.md, 500],
]
const fallbackChartWidth = 320

const getChartWidth = (windowWidth: number) =>
  chartWidthByBreakpoint.find(([minWidth]) => windowWidth >= minWidth)?.[1] ??
  fallbackChartWidth

const EmptyChart = ({
  locale,
  metricType,
  peggedToken,
  period,
  width,
}: {
  locale: string
  metricType: MetricType
  peggedToken: EvmToken
  period: MetricPeriod
  width: number
}) => (
  <VictoryChart
    height={chartHeight}
    padding={getChartPadding(metricType)}
    width={width}
  >
    <VictoryAxis
      style={xAxisStyle}
      tickFormat={(tick: number) => formatShortTimestamp(tick, locale)}
      tickValues={getPlaceholderXTicks(period)}
    />
    <VictoryAxis
      dependentAxis
      style={yAxisStyle}
      tickFormat={(v: number) =>
        formatYAxis({ locale, metricType, peggedToken, value: v })
      }
      tickValues={metricType === 'apy' ? [0, 2, 4, 6] : undefined}
    />
  </VictoryChart>
)

type Props = {
  data: MetricDataPoint[] | undefined
  isError: boolean
  isPending: boolean
  metricType: MetricType
  peggedToken: EvmToken
  period: MetricPeriod
}

export const HistoricalMetricsChart = function ({
  data,
  isError,
  isPending,
  metricType,
  peggedToken,
  period,
}: Props) {
  const locale = useLocale()
  const { width: windowWidth } = useWindowSize()
  const chartWidth = getChartWidth(windowWidth)

  if (data !== undefined && data.length > 0) {
    return (
      <div>
        <VictoryChart
          containerComponent={
            <VictoryVoronoiContainer
              labelComponent={
                <VictoryTooltip
                  constrainToVisibleArea
                  cornerRadius={8}
                  flyoutPadding={{ bottom: 8, left: 12, right: 12, top: 8 }}
                  flyoutStyle={{
                    fill: 'white',
                    stroke: '#E5E5E5',
                  }}
                  labelComponent={
                    <ChartTooltipLabel
                      locale={locale}
                      metricType={metricType}
                      peggedToken={peggedToken}
                    />
                  }
                  pointerLength={0}
                  style={{ fontSize: 11 }}
                />
              }
              labels={({ datum }: { datum: MetricDataPoint }) =>
                `${formatFullTimestamp(datum.x, locale)}  ${formatYAxis({
                  locale,
                  metricType,
                  peggedToken,
                  precision: 'full',
                  value: datum.y,
                })}`
              }
              voronoiBlacklist={['area']}
            />
          }
          height={chartHeight}
          padding={getChartPadding(metricType)}
          width={chartWidth}
        >
          <VictoryAxis
            style={xAxisStyle}
            tickCount={4}
            tickFormat={(tick: number) => formatShortTimestamp(tick, locale)}
          />
          <VictoryAxis
            dependentAxis
            style={yAxisStyle}
            tickFormat={(v: number) =>
              formatYAxis({ locale, metricType, peggedToken, value: v })
            }
          />
          <AreaGradient />
          <VictoryArea
            data={data}
            interpolation="linear"
            name="area"
            style={{
              data: {
                fill: 'url(#hemi-area-gradient)',
                stroke: 'none',
              },
            }}
          />
          <VictoryLine
            data={data}
            interpolation="linear"
            style={{
              data: {
                stroke: '#FF4600',
                strokeWidth: 2,
              },
            }}
          />
        </VictoryChart>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="opacity-30">
        <EmptyChart
          locale={locale}
          metricType={metricType}
          peggedToken={peggedToken}
          period={period}
          width={chartWidth}
        />
      </div>
    )
  }

  if (!isPending) {
    return (
      <EmptyChart
        locale={locale}
        metricType={metricType}
        peggedToken={peggedToken}
        period={period}
        width={chartWidth}
      />
    )
  }

  return (
    <div className="relative">
      <div className="invisible">
        <EmptyChart
          locale={locale}
          metricType={metricType}
          peggedToken={peggedToken}
          period={period}
          width={chartWidth}
        />
      </div>
      <div className="absolute inset-0">
        <Skeleton height="100%" />
      </div>
    </div>
  )
}
