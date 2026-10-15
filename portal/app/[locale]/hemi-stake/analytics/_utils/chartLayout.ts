const tickLabelStyle = {
  fill: '#737373',
  fontFamily: 'Geist, sans-serif',
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: 0.22,
  lineHeight: '16px',
}

export const xAxisStyle = {
  axis: { stroke: 'transparent' },
  tickLabels: tickLabelStyle,
}

export const yAxisStyle = {
  ...xAxisStyle,
  grid: { stroke: '#E5E5E5', strokeDasharray: '4,4' },
}

export const epochAxisStyle = {
  ...xAxisStyle,
  axisLabel: { ...xAxisStyle.tickLabels, padding: 26 },
}

export const chartHeight = 180
// right leaves room for the last date label, which is centred on its tick
export const chartPadding = { bottom: 24, left: 64, right: 16, top: 8 }
export const rewardsChartPadding = { ...chartPadding, bottom: 40 }

// A bar takes up its whole slot, so the first and last ones need half a slot of
// room or they spill over the axis and its labels.
export const getHalfSlot = ({
  barCount,
  chartWidth,
}: {
  barCount: number
  chartWidth: number
}) => (chartWidth - chartPadding.left - chartPadding.right) / (2 * barCount)
