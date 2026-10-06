import { formatPercentage } from 'utils/format'

export const formatApy = (ratio: number) => formatPercentage(ratio * 100)
