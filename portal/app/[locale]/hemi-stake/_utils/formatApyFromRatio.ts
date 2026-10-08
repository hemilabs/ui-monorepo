import { formatApyDisplay } from 'utils/format'

export const formatApyFromRatio = (ratio: number) =>
  formatApyDisplay(ratio * 100)
