import { useFormat } from 'hooks/useFormat'
import { EvmToken } from 'types/token'

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
  const { formatCompactFiatParts, formatPercentage } = useFormat()

  if (metricType === 'apy') {
    return <>{formatPercentage(value)}</>
  }
  const { number, suffix } = formatCompactFiatParts(value)
  return (
    <>
      <span>{number}</span>
      <span className="text-neutral-400">{suffix}</span>
      <span>{` ${peggedToken.symbol}`}</span>
    </>
  )
}
