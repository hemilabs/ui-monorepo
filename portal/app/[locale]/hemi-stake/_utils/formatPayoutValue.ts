import { defaultLocale } from 'i18n/routing'
import { formatNumber, formatTokenPrice } from 'utils/format'

export const formatPayoutValue = ({
  price,
  symbol,
  value,
}: {
  price: number | undefined
  symbol: string
  value: number
}) =>
  price === undefined
    ? `${formatNumber(value)} ${symbol}`
    : formatTokenPrice(value * price, defaultLocale)
