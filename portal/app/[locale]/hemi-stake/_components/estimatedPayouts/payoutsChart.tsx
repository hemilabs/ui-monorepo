import { useWindowSize } from '@hemilabs/react-hooks/useWindowSize'
import Skeleton from 'react-loading-skeleton'
import { screenBreakpoints } from 'styles'
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLine,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory'

import { type PayoutPoint } from '../../_utils/payoutsChartData'

const chartColors = {
  neutral200: '#E5E5E5',
  neutral400: '#A3A3A3',
  neutral500: '#737373',
  neutral950: '#0A0A0A',
  orange500: '#FF600A',
}

const chartHeight = 132
const chartPadding = { bottom: 24, left: 64, right: 20, top: 8 }
const fallbackChartWidth = 320

const widthByBreakpoint: ReadonlyArray<[number, number]> = [
  [screenBreakpoints.lg, 460],
  [screenBreakpoints.md, 420],
]

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

type Props = {
  formatDate: (value: number) => string
  formatDetail: (point: PayoutPoint) => string
  formatValue: (value: number) => string
  isPending: boolean
  series: PayoutPoint[]
  ticks: number[]
  unlockX: number | undefined
}

export const PayoutsChart = function ({
  formatDate,
  formatDetail,
  formatValue,
  isPending,
  series,
  ticks,
  unlockX,
}: Props) {
  const { width: windowWidth } = useWindowSize()
  const chartWidth =
    widthByBreakpoint.find(([minWidth]) => windowWidth >= minWidth)?.[1] ??
    fallbackChartWidth

  const toTooltipLabel = (point: PayoutPoint) =>
    `${formatDate(point.x)}  ${formatDetail(point)}`

  const hasPayouts = series.some(point => point.y > 0)
  const maxY = Math.max(...series.map(point => point.y), 0)

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

  if (hasPayouts) {
    return (
      <VictoryChart
        containerComponent={
          <VictoryVoronoiContainer
            labelComponent={
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
            }
            labels={({ datum }: { datum: PayoutPoint }) =>
              toTooltipLabel(datum)
            }
            voronoiBlacklist={[unlockMarkerName]}
            voronoiDimension="x"
          />
        }
        domainPadding={{ x: halfSlot }}
        height={chartHeight}
        padding={chartPadding}
        width={chartWidth}
      >
        {axes}
        <VictoryBar
          barRatio={0.7}
          data={series}
          style={{ data: { fill: chartColors.orange500 } }}
        />
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
      height={chartHeight}
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
