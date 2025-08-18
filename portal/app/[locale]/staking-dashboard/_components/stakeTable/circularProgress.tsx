type Props = {
  percentage: number
  size?: number
  strokeWidth?: number
}

export function CircularProgress({
  percentage,
  size = 23,
  strokeWidth = 3,
}: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * ((100 - percentage) / 100)

  return (
    <svg className="-rotate-90" height={size} width={size}>
      <circle
        className="text-orange-100"
        cx={size / 2}
        cy={size / 2}
        fill="transparent"
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <circle
        className="text-orange-500"
        cx={size / 2}
        cy={size / 2}
        fill="transparent"
        r={radius}
        stroke="currentColor"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  )
}
