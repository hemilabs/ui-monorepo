import Skeleton from 'react-loading-skeleton'
import { VictoryArea, VictoryAxis, VictoryChart, VictoryLine } from 'victory'

import { payoutsColor } from '../../_components/payoutsChart'
import { type ChartWidths, useChartWidth } from '../../_hooks/useChartWidth'
import { type ChartPoint } from '../../_utils/chartPoint'

const chartHeight = 130
const chartPadding = { bottom: 24, left: 64, right: 20, top: 8 }
const markerColor = '#A3A3A3'

const tickLabelStyle = {
  fill: markerColor,
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
  grid: { stroke: '#E5E5E5', strokeDasharray: '4,4' },
}

type Props = {
  formatDate: (value: number) => string
  formatValue: (value: number) => string
  isPending: boolean
  series: ChartPoint[]
  ticks: number[]
  unlockX: number | undefined
  widths: ChartWidths
}

export const VotingPowerChart = function ({
  formatDate,
  formatValue,
  isPending,
  series,
  ticks,
  unlockX,
  widths,
}: Props) {
  const chartWidth = useChartWidth(widths)

  const hasWeight = series.some(point => point.y > 0)
  const maxY = Math.max(...series.map(point => point.y), 0)

  const chart = (
    <VictoryChart
      height={chartHeight}
      padding={chartPadding}
      width={chartWidth}
    >
      <VictoryAxis
        style={xAxisStyle}
        tickFormat={formatDate}
        tickValues={ticks.length > 0 ? ticks : undefined}
      />
      <VictoryAxis
        dependentAxis
        style={yAxisStyle}
        tickCount={3}
        tickFormat={hasWeight ? formatValue : () => ''}
      />
      <VictoryArea
        data={hasWeight ? series : []}
        style={{
          data: {
            fill: payoutsColor,
            fillOpacity: 0.16,
            stroke: payoutsColor,
            strokeWidth: 1.5,
          },
        }}
      />
      {hasWeight && unlockX !== undefined && (
        <VictoryLine
          data={[
            { x: unlockX, y: 0 },
            { x: unlockX, y: maxY },
          ]}
          style={{
            data: {
              stroke: markerColor,
              strokeDasharray: '3,3',
              strokeWidth: 1,
            },
          }}
        />
      )}
    </VictoryChart>
  )

  if (!isPending) {
    return chart
  }

  return (
    <div className="relative">
      <div className="invisible flex">{chart}</div>
      <div className="absolute inset-0">
        <Skeleton height="100%" />
      </div>
    </div>
  )
}
