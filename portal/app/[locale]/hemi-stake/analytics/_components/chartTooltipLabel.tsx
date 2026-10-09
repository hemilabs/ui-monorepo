const tooltipRowHeight = 12
const swatchSize = 7

export const tooltipWidth = 186

export const getTooltipHeight = ({
  hasNote,
  lineCount,
}: {
  hasNote: boolean
  lineCount: number
}) => (lineCount + (hasNote ? 3 : 2)) * tooltipRowHeight + 12

type Line = {
  color?: string
  dashed?: boolean
  label: string
  value?: string
}

type Props = {
  lines: Line[]
  note?: string
  title: string
  total: string
  totalLabel: string
  width?: number
  x: number
  y: number
}

export const ChartTooltipLabel = function ({
  lines,
  note,
  title,
  total,
  totalLabel,
  width = tooltipWidth,
  x,
  y,
}: Props) {
  const left = x - width / 2 + 12
  const right = x + width / 2 - 12
  const top =
    y -
    getTooltipHeight({
      hasNote: note !== undefined,
      lineCount: lines.length,
    }) /
      2 +
    15.5
  const totalTop = top + (lines.length + 1) * tooltipRowHeight

  return (
    <g style={{ fontFamily: 'Geist, sans-serif', fontSize: 9 }}>
      <text fill="#737373" fontWeight={500} x={left} y={top}>
        {title}
      </text>
      {lines.map((line, index) => (
        <g key={line.label}>
          {line.color !== undefined && (
            <rect
              fill={line.dashed ? 'none' : line.color}
              height={swatchSize}
              rx={2}
              stroke={line.dashed ? line.color : 'none'}
              strokeDasharray="2,1"
              width={swatchSize}
              x={left}
              y={top + (index + 1) * tooltipRowHeight - swatchSize + 1}
            />
          )}
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
      <text fill="#0a0a0a" fontWeight={600} x={left} y={totalTop}>
        {totalLabel}
      </text>
      <text
        fill="#0a0a0a"
        fontWeight={600}
        textAnchor="end"
        x={right}
        y={totalTop}
      >
        {total}
      </text>
      {note !== undefined && (
        <text fill="#737373" x={left} y={totalTop + tooltipRowHeight}>
          {note}
        </text>
      )}
    </g>
  )
}
