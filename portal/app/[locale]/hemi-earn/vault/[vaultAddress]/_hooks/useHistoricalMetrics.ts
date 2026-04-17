import { useQuery } from '@tanstack/react-query'
import { type Address, type Chain } from 'viem'

export type MetricPeriod = '1w' | '1m' | '3m' | '1y'
export type MetricType = 'deposits' | 'apy'
export type MetricDataPoint = { x: number; y: number }

const periodDurations: Record<MetricPeriod, number> = {
  '1m': 30 * 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1y': 365 * 24 * 60 * 60 * 1000,
  '3m': 90 * 24 * 60 * 60 * 1000,
}

// Simple seeded pseudo-random for deterministic mock data
const seededRandom = function (seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const generateMockData = function (
  period: MetricPeriod,
  metricType: MetricType,
) {
  const now = Date.now()
  const duration = periodDurations[period]
  const points = 20
  const step = duration / (points - 1)

  return Array.from({ length: points }, function (_, i) {
    const seed = i + (metricType === 'apy' ? 100 : 200)
    const random = seededRandom(seed)

    const y =
      metricType === 'apy'
        ? 2 + random * 3 // APY between 2% and 5%
        : 380_000_000 + random * 50_000_000 // Deposits between $380M and $430M

    return {
      x: now - duration + i * step,
      y,
    }
  })
}

const mockDelay = 2000

type UseHistoricalMetrics = {
  chainId: Chain['id']
  metricType: MetricType
  period: MetricPeriod
  vaultAddress: Address
}

// TODO: replace mocked data with real API call once the backend endpoint is available.
export const useHistoricalMetrics = ({
  chainId,
  metricType,
  period,
  vaultAddress,
}: UseHistoricalMetrics) =>
  useQuery({
    queryFn: () =>
      new Promise<MetricDataPoint[]>(resolve =>
        setTimeout(
          () => resolve(generateMockData(period, metricType)),
          mockDelay,
        ),
      ),
    queryKey: ['historical-metrics', chainId, vaultAddress, period, metricType],
  })
