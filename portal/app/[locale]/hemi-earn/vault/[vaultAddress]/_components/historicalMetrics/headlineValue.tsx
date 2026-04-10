import { formatCompactFiatParts } from 'utils/format'

import { type MetricType } from '../../_hooks/useHistoricalMetrics'

type Props = {
  locale: string
  metricType: MetricType
  value: number
}

export const HeadlineValue = function ({ locale, metricType, value }: Props) {
  if (metricType === 'apy') {
    return <>{value.toFixed(2)}%</>
  }
  const { number, suffix } = formatCompactFiatParts(value, locale)
  return (
    <>
      <span>{number}</span>
      <span className="text-neutral-400">{suffix}</span>
    </>
  )
}
