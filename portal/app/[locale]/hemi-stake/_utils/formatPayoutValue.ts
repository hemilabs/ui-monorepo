import {
  formatCompactFiatParts,
  formatFiatNumber,
  formatNumber,
} from 'utils/format'

type PayoutPrecision = 'compact' | 'full'

export const formatPayoutValue = function ({
  locale,
  precision = 'compact',
  price,
  symbol,
  value,
}: {
  locale: string
  precision?: PayoutPrecision
  price?: number
  symbol: string
  value: number
}) {
  const inFiat = price !== undefined
  const amount = inFiat ? value * price : value

  if (precision === 'full') {
    return inFiat
      ? `$${formatFiatNumber(amount)}`
      : `${formatNumber(amount)} ${symbol}`
  }

  const { number, suffix } = formatCompactFiatParts(amount, locale)
  return inFiat ? `$${number}${suffix}` : `${number}${suffix} ${symbol}`
}
