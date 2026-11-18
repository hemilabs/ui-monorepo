import { useWindowSize } from '@hemilabs/react-hooks/useWindowSize'
import { screenBreakpoints } from 'styles'

export type ChartWidths = {
  breakpoints: ReadonlyArray<[number, number]>
  fallback: number
}

const fullWidthChart: ChartWidths = {
  breakpoints: [
    [screenBreakpoints.xl, 900],
    [screenBreakpoints.lg, 700],
    [screenBreakpoints.md, 560],
  ],
  fallback: 340,
}

export const useChartWidth = function (widths: ChartWidths = fullWidthChart) {
  const { width: windowWidth } = useWindowSize()
  return (
    widths.breakpoints.find(([minWidth]) => windowWidth >= minWidth)?.[1] ??
    widths.fallback
  )
}
