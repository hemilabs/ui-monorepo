import {
  formatCompactFiatParts,
  formatFiatNumber,
  formatNumber,
} from 'utils/format'

import { type SupplyUnit } from './supplyHistory'

export type SupplyPrecision = 'compact' | 'full'

export const formatSupplyValue = function ({
  locale,
  precision = 'compact',
  symbol,
  unit,
  value,
}: {
  locale: string
  precision?: SupplyPrecision
  symbol: string
  unit: SupplyUnit
  value: number
}) {
  const sign = value < 0 ? '-' : ''
  const amount = Math.abs(value)

  if (precision === 'full') {
    return unit === 'usd'
      ? `${sign}$${formatFiatNumber(amount)}`
      : `${sign}${formatNumber(amount)} ${symbol}`
  }

  const { number, suffix } = formatCompactFiatParts(amount, locale)
  return unit === 'usd'
    ? `${sign}$${number}${suffix}`
    : `${sign}${number}${suffix} ${symbol}`
}
