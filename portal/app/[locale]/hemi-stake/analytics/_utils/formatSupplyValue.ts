import { formatCompactFiatParts } from 'utils/format'

import { type SupplyUnit } from './supplyHistory'

export const formatSupplyValue = function ({
  locale,
  symbol,
  unit,
  value,
}: {
  locale: string
  symbol: string
  unit: SupplyUnit
  value: number
}) {
  const { number, suffix } = formatCompactFiatParts(Math.abs(value), locale)
  const sign = value < 0 ? '-' : ''
  return unit === 'usd'
    ? `${sign}$${number}${suffix}`
    : `${sign}${number}${suffix} ${symbol}`
}
