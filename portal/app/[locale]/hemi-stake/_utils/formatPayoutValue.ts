import { formatFiatAmount, formatNumber } from 'utils/format'

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
    : formatFiatAmount(value * price)
