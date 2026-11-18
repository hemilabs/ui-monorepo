import { type Formatter } from 'utils/format'

export const formatApyFromRatio = (ratio: number, formatter: Formatter) =>
  formatter.formatApyDisplay(ratio * 100)
