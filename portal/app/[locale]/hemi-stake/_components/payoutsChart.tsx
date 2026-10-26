import Skeleton from 'react-loading-skeleton'
import { screenBreakpoints } from 'styles'
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLine,
  VictoryStack,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory'

import { type ChartWidths, useChartWidth } from '../_hooks/useChartWidth'
import { type PayoutPoint } from '../_utils/payoutsChartData'

import {
  ChartTooltipLabel,
  getTooltipHeight,
  tooltipWidth,
} from './chartTooltipLabel'

export const payoutsColor = '#FF600A'
export const stackedBelowColor = '#FFD1A5'

const chartColors = {
  neutral200: '#E5E5E5',
  neutral400: '#A3A3A3',
  neutral500: '#737373',
  neutral950: '#0A0A0A',
}

const defaultChartHeight = 132
const chartPadding = { bottom: 24, left: 64, right: 20, top: 8 }

const defaultWidths: ChartWidths = {
  breakpoints: [
    [screenBreakpoints.lg, 460],
    [screenBreakpoints.md, 420],
  ],
  fallback: 320,
}

const unlockMarkerName = 'unlock-marker'

const tooltipLabelStyle = {
  fontFamily: 'Geist, sans-serif',
  fontSize: 9,
}

const tickLabelStyle = {
  fill: chartColors.neutral400,
  fontFamily: 'Geist, sans-serif',
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: 0.22,
}

const xAxisStyle = {
  axis: { stroke: 'transparent' },
  tickLabels: tickLabelStyle,
}

const yAxisStyle = {
  ...xAxisStyle,
  grid: { stroke: chartColors.neutral200, strokeDasharray: '4,4' },
}

function PayoutTooltipLabel({
  datum,
  formatDate,
  formatDetail,
  x,
  y,
}: {
  datum?: PayoutPoint
  formatDate: (value: number) => string
  formatDetail: (point: PayoutPoint) => string
  x?: number
  y?: number
}) {
  if (datum === undefined) {
    return null
  }

  return (
    <text
      dominantBaseline="central"
      style={{ fontSize: 9 }}
      textAnchor="middle"
      x={x}
      y={y}
    >
      <tspan fill={chartColors.neutral500}>{formatDate(datum.x)}</tspan>
      <tspan dx={4} fill={chartColors.neutral950}>
        {formatDetail(datum)}
      </tspan>
    </text>
  )
}

type StackedBelow = {
  label: string
  points: PayoutPoint[]
  seriesLabel: string
  totalLabel: string
}

function StackedTooltipLabel({
  below,
  belowByX,
  datum,
  formatDate,
  formatValue,
  seriesByX,
  x,
  y,
}: {
  below: StackedBelow
  belowByX: Map<number, number>
  datum?: PayoutPoint
  formatDate: (value: number) => string
  formatValue: (value: number) => string
  seriesByX: Map<number, number>
  x?: number
  y?: number
}) {
  if (datum === undefined || x === undefined || y === undefined) {
    return null
  }

  const top = seriesByX.get(datum.x) ?? 0
  const bottom = belowByX.get(datum.x) ?? 0

  return (
    <ChartTooltipLabel
      lines={[
        {
          color: payoutsColor,
          label: below.seriesLabel,
          value: formatValue(top),
        },
        {
          color: stackedBelowColor,
          label: below.label,
          value: formatValue(bottom),
        },
      ]}
      title={formatDate(datum.x)}
      total={formatValue(top + bottom)}
      totalLabel={below.totalLabel}
      x={x}
      y={y}
    />
  )
}

type Props = {
  below?: StackedBelow
  formatDate: (value: number) => string
  formatDetail: (point: PayoutPoint) => string
  formatValue: (value: number) => string
  height?: number
  isPending: boolean
  series: PayoutPoint[]
  ticks: number[]
  unlockX: number | undefined
  widths?: ChartWidths
}

export const PayoutsChart = function ({
  below,
  formatDate,
  formatDetail,
  formatValue,
  height = defaultChartHeight,
  isPending,
  series,
  ticks,
  unlockX,
  widths = defaultWidths,
}: Props) {
  const chartWidth = useChartWidth(widths)

  const belowPoints = below ? below.points : []
  const belowByX = new Map(belowPoints.map(point => [point.x, point.y]))
  const seriesByX = new Map(series.map(point => [point.x, point.y]))

  const hasPayouts = [...series, ...belowPoints].some(point => point.y > 0)
  const maxY = Math.max(
    ...series.map(point => point.y + (belowByX.get(point.x) ?? 0)),
    0,
  )

  const halfSlot =
    series.length > 0
      ? (chartWidth - chartPadding.left - chartPadding.right) /
        (2 * series.length)
      : 0

  const axes = [
    <VictoryAxis
      key="x"
      style={xAxisStyle}
      tickFormat={formatDate}
      tickValues={ticks.length > 0 ? ticks : undefined}
    />,
    <VictoryAxis
      dependentAxis
      key="y"
      style={yAxisStyle}
      tickCount={3}
      tickFormat={hasPayouts ? formatValue : () => ''}
    />,
  ]

  // Victory builds the tooltip datum from the first stacked child, so the
  // stacked label resolves both legs by x instead of reading that datum.
  const singleTooltip = (
    <VictoryTooltip
      constrainToVisibleArea
      cornerRadius={8}
      flyoutPadding={{ bottom: 6, left: 10, right: 10, top: 6 }}
      flyoutStyle={{ fill: 'white', stroke: chartColors.neutral200 }}
      labelComponent={
        <PayoutTooltipLabel
          formatDate={formatDate}
          formatDetail={formatDetail}
        />
      }
      pointerLength={0}
      style={tooltipLabelStyle}
    />
  )

  if (hasPayouts) {
    return (
      <VictoryChart
        containerComponent={
          <VictoryVoronoiContainer
            labelComponent={
              below === undefined ? (
                singleTooltip
              ) : (
                <VictoryTooltip
                  constrainToVisibleArea
                  cornerRadius={8}
                  flyoutHeight={getTooltipHeight({
                    hasNote: false,
                    lineCount: 2,
                  })}
                  flyoutStyle={{
                    fill: 'white',
                    stroke: chartColors.neutral200,
                  }}
                  flyoutWidth={tooltipWidth}
                  labelComponent={
                    <StackedTooltipLabel
                      below={below}
                      belowByX={belowByX}
                      formatDate={formatDate}
                      formatValue={formatValue}
                      seriesByX={seriesByX}
                    />
                  }
                  pointerLength={0}
                />
              )
            }
            labels={({ datum }: { datum: PayoutPoint }) =>
              below === undefined
                ? `${formatDate(datum.x)}  ${formatDetail(datum)}`
                : ' '
            }
            voronoiBlacklist={[unlockMarkerName]}
            voronoiDimension="x"
          />
        }
        domainPadding={{ x: halfSlot }}
        height={height}
        padding={chartPadding}
        width={chartWidth}
      >
        {axes}
        {below === undefined ? (
          <VictoryBar
            barRatio={0.7}
            data={series}
            style={{ data: { fill: payoutsColor } }}
          />
        ) : (
          <VictoryStack>
            <VictoryBar
              barRatio={0.7}
              data={below.points}
              style={{ data: { fill: stackedBelowColor } }}
            />
            <VictoryBar
              barRatio={0.7}
              data={series}
              style={{ data: { fill: payoutsColor } }}
            />
          </VictoryStack>
        )}
        {unlockX !== undefined && (
          <VictoryLine
            data={[
              { x: unlockX, y: 0 },
              { x: unlockX, y: maxY },
            ]}
            name={unlockMarkerName}
            style={{
              data: {
                stroke: chartColors.neutral400,
                strokeDasharray: '3,3',
                strokeWidth: 1,
              },
            }}
          />
        )}
      </VictoryChart>
    )
  }

  const emptyChart = (
    <VictoryChart
      domainPadding={{ x: halfSlot }}
      height={height}
      padding={chartPadding}
      width={chartWidth}
    >
      {axes}
      <VictoryBar
        barRatio={0.7}
        data={series.map((point, index) => ({
          ...point,
          y: Math.max(series.length - index, 0),
        }))}
        style={{ data: { fill: chartColors.neutral200 } }}
      />
    </VictoryChart>
  )

  if (!isPending) {
    return emptyChart
  }

  return (
    <div className="relative">
      <div className="invisible flex">{emptyChart}</div>
      <div className="absolute inset-0">
        <Skeleton height="100%" />
      </div>
    </div>
  )
}
