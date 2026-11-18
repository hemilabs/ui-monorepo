import { type Formatter } from 'utils/format'

import { type ChartUnit } from '../../_utils/chartUnit'

export type SupplyPrecision = 'compact' | 'full'

export const formatSupplyValue = function ({
  formatter,
  precision = 'compact',
  symbol,
  unit,
  value,
}: {
  formatter: Formatter
  precision?: SupplyPrecision
  symbol: string
  unit: ChartUnit
  value: number
}) {
  const sign = value < 0 ? '-' : ''
  const amount = Math.abs(value)

  if (precision === 'full') {
    return unit === 'usd'
      ? `${sign}$${formatter.formatFiatNumber(amount)}`
      : `${sign}${formatter.formatNumber(amount)} ${symbol}`
  }

  const { number, suffix } = formatter.formatCompactFiatParts(amount)
  return unit === 'usd'
    ? `${sign}$${number}${suffix}`
    : `${sign}${number}${suffix} ${symbol}`
}
