import { useQuery } from '@tanstack/react-query'
import { type EvmToken } from 'types/token'
import { type Address } from 'viem'

import {
  type MetricDataPoint,
  type MetricPeriod,
  type MetricType,
} from '../../../types'

// Temporary stub: the previous subgraph endpoint was removed in #1917.
// Returns mocked MetricDataPoint[] directly so the chart still renders;
// re-wire to the new data source once it's available.

const periodToMs: Record<MetricPeriod, number> = {
  '1m': 30 * 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1y': 365 * 24 * 60 * 60 * 1000,
  '3m': 90 * 24 * 60 * 60 * 1000,
}

const generateMockMetric = function (
  period: MetricPeriod,
  metricType: MetricType,
): MetricDataPoint[] {
  const points = 30
  const now = Date.now()
  const span = periodToMs[period]
  return Array.from({ length: points }, function (_, i) {
    const x = now - span + (span * i) / (points - 1)
    const noise = Math.sin(i + 100) * 10000
    const random = noise - Math.floor(noise)
    const y =
      metricType === 'apy' ? 2 + random * 3 : 1_000_000 + random * 250_000
    return { x, y }
  })
}

type UseHistoricalMetrics = {
  assetAddress: Address
  metricType: MetricType
  period: MetricPeriod
  token: EvmToken
}

export const useHistoricalMetrics = ({
  assetAddress,
  metricType,
  period,
  token,
}: UseHistoricalMetrics) =>
  useQuery({
    queryFn: (): Promise<MetricDataPoint[]> =>
      Promise.resolve(generateMockMetric(period, metricType)),
    queryKey: [
      'historical-metrics',
      metricType,
      period,
      token.chainId,
      assetAddress,
    ],
  })
