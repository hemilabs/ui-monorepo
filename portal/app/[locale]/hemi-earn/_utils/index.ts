import { formatPercentage } from 'utils/format'

export const formatApyDisplay = function (apy: number) {
  if (apy < 0.01) {
    return '< 0.01%'
  }
  return formatPercentage(apy)
}
