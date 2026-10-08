import { useWindowSize } from '@hemilabs/react-hooks/useWindowSize'
import { screenBreakpoints } from 'styles'

const fallbackChartWidth = 340

const widthByBreakpoint: ReadonlyArray<[number, number]> = [
  [screenBreakpoints.xl, 900],
  [screenBreakpoints.lg, 700],
  [screenBreakpoints.md, 560],
]

export const useChartWidth = function () {
  const { width: windowWidth } = useWindowSize()
  return (
    widthByBreakpoint.find(([minWidth]) => windowWidth >= minWidth)?.[1] ??
    fallbackChartWidth
  )
}
