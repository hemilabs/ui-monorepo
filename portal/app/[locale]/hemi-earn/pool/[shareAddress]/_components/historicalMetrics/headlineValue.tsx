import { useLocale } from 'next-intl'
import { EvmToken } from 'types/token'
import { formatCompactFiatParts, formatPercentage } from 'utils/format'

import { type MetricType } from '../../../../types'

type Props = {
  metricType: MetricType
  peggedToken: EvmToken
  value: number
}

export const HeadlineValue = function ({
  metricType,
  peggedToken,
  value,
}: Props) {
  const locale = useLocale()

  if (metricType === 'apy') {
    return <>{formatPercentage(value)}</>
  }
  const { number, suffix } = formatCompactFiatParts(value, locale)
  return (
    <>
      <span>{`${number} ${peggedToken.symbol}`}</span>
      <span className="text-neutral-400">{suffix}</span>
    </>
  )
}
