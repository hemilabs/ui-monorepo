import { formatFiatAmount, formatNumber } from 'utils/format'

export const formatPayoutValue = ({
  symbol,
  value,
}: {
  symbol: string
  value: number
}) => `${formatNumber(value)} ${symbol}`

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
    ? formatPayoutValue({ symbol, value })
    : `${formatPayoutValue({ symbol, value })} · ${formatFiatAmount(value * price)}`
