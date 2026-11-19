import { type Formatter } from 'utils/format'

const formatTokenAmount = ({
  formatter,
  symbol,
  value,
}: {
  formatter: Formatter
  symbol: string
  value: number
}) => `${formatter.formatNumber(value)} ${symbol}`

export const formatPayoutValue = function ({
  formatter,
  symbol,
  value,
}: {
  formatter: Formatter
  symbol: string
  value: number
}) {
  const { number, suffix } = formatter.formatCompactFiatParts(value)
  return `${number}${suffix} ${symbol}`
}

export const formatPayoutDetail = ({
  formatter,
  price,
  symbol,
  value,
}: {
  formatter: Formatter
  price: number | undefined
  symbol: string
  value: number
}) =>
  price === undefined
    ? formatTokenAmount({ formatter, symbol, value })
    : `${formatTokenAmount({ formatter, symbol, value })} · ${formatter.formatFiatAmount(value * price)}`
