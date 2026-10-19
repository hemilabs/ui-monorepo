import { defaultLocale } from 'i18n/routing'
import {
  formatCompactFiatParts,
  formatFiatAmount,
  formatNumber,
} from 'utils/format'

const withSymbol = ({ symbol, value }: { symbol: string; value: number }) =>
  `${formatNumber(value)} ${symbol}`

export const formatPayoutValue = function ({
  symbol,
  value,
}: {
  symbol: string
  value: number
}) {
  const { number, suffix } = formatCompactFiatParts(value, defaultLocale)
  return `${number}${suffix} ${symbol}`
}

export const formatPayoutDetail = ({
  price,
  symbol,
  value,
}: {
  price: number | undefined
  symbol: string
  value: number
}) =>
  price === undefined
    ? withSymbol({ symbol, value })
    : `${withSymbol({ symbol, value })} · ${formatFiatAmount(value * price)}`
