import { formatApyDisplay } from 'utils/format'

export const formatApyFromRatio = (ratio: number, locale: string) =>
  formatApyDisplay(ratio * 100, locale)
