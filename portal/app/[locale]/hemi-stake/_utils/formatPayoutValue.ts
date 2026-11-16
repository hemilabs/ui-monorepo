import {
  formatCompactFiatParts,
  formatFiatAmount,
  formatNumber,
} from 'utils/format'

const formatTokenAmount = ({
  locale,
  symbol,
  value,
}: {
  locale: string
  symbol: string
  value: number
}) => `${formatNumber(value, locale)} ${symbol}`

export const formatPayoutValue = function ({
  locale,
  symbol,
  value,
}: {
  locale: string
  symbol: string
  value: number
}) {
  const { number, suffix } = formatCompactFiatParts(value, locale)
  return `${number}${suffix} ${symbol}`
}

export const formatPayoutDetail = ({
  locale,
  price,
  symbol,
  value,
}: {
  locale: string
  price: number | undefined
  symbol: string
  value: number
}) =>
  price === undefined
    ? formatTokenAmount({ locale, symbol, value })
    : `${formatTokenAmount({ locale, symbol, value })} · ${formatFiatAmount(value * price, locale)}`
