'use client'

import { useWindowSize } from '@hemilabs/react-hooks/useWindowSize'
import { useLocale } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { screenBreakpoints } from 'styles'
import { formatCompactFiat, formatDate, formatShortDate } from 'utils/format'
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
} from '../../_hooks/useHistoricalMetrics'

const getChartPadding = (metricType: MetricType) => ({
  bottom: 24,
  // APY labels are short ("4%"), but deposits labels can be longer since
  // locales like es/pt render compact notation with a space (eg. "$400 M"
  // instead of the en "$400M"), so we reserve extra room for them.
  left: metricType === 'apy' ? 28 : 51,
  right: 0,
  top: 4,
})

const tickLabelStyle = {
  fill: '#737373',
  fontFamily: 'Geist, sans-serif',
  fontSize: 11,
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
  formatShortDate(new Date(timestampMs), locale)

const formatFullTimestamp = (timestampMs: number, locale: string) =>
  formatDate(new Date(timestampMs), locale)

const formatYAxis = function (
  value: number,
  metricType: MetricType,
  locale: string,
) {
  if (metricType === 'apy') {
    return `${Math.round(value)}%`
  }
  return formatCompactFiat(value, locale)
}

function ChartTooltipLabel({
  datum,
  locale,
  metricType,
  x,
  y,
}: {
  datum?: MetricDataPoint
  locale: string
  metricType: MetricType
  x?: number
  y?: number
}) {
  if (datum === undefined) {
    return null
  }

  const dateText = formatFullTimestamp(datum.x, locale)
  const valueText = formatYAxis(datum.y, metricType, locale)

  return (
    <text
      dominantBaseline="central"
      style={{ fontSize: 11 }}
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

// Victory renders the chart as an SVG with a viewBox, and the SVG scales to
// fill its container width. This means the chosen width defines the baseline
// coordinate system used by the labels — a smaller viewBox width makes the
// labels appear larger on screen (they get scaled up), and a larger viewBox
// width makes them smaller. We pick different widths per breakpoint so the
// axis tick labels end up roughly the same visual size on every layout.
// Entries are checked from largest to smallest breakpoint and the first
// match wins; the fallback is used below the smallest breakpoint.
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
  period,
  width,
}: {
  locale: string
  metricType: MetricType
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
      tickFormat={(v: number) => formatYAxis(v, metricType, locale)}
      tickValues={metricType === 'apy' ? [0, 2, 4, 6] : undefined}
    />
  </VictoryChart>
)

type Props = {
  data: MetricDataPoint[] | undefined
  isError: boolean
  isPending: boolean
  metricType: MetricType
  period: MetricPeriod
}

export const HistoricalMetricsChart = function ({
  data,
  isError,
  isPending,
  metricType,
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
                    />
                  }
                  pointerLength={0}
                  style={{ fontSize: 11 }}
                />
              }
              labels={({ datum }: { datum: MetricDataPoint }) =>
                `${formatFullTimestamp(datum.x, locale)}  ${formatYAxis(
                  datum.y,
                  metricType,
                  locale,
                )}`
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
            tickFormat={(v: number) => formatYAxis(v, metricType, locale)}
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
