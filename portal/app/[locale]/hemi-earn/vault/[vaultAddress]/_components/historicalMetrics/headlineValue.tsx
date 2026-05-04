import { useLocale } from 'next-intl'
import { formatCompactFiatParts, formatPercentage } from 'utils/format'

import { type MetricType } from '../../../../types'

type Props = {
  metricType: MetricType
  value: number
}

export const HeadlineValue = function ({ metricType, value }: Props) {
  const locale = useLocale()

  if (metricType === 'apy') {
    return <>{formatPercentage(value)}</>
  }
  const { number, suffix } = formatCompactFiatParts(value, locale)
  return (
    <>
      <span>{number}</span>
      <span className="text-neutral-400">{suffix}</span>
    </>
  )
}
