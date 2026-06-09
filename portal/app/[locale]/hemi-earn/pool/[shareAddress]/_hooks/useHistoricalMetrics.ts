import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { type EvmToken } from 'types/token'
import { isValidUrl } from 'utils/url'
import { type Address, formatUnits } from 'viem'

import {
  type MetricDataPoint,
  type MetricPeriod,
  type MetricType,
} from '../../../types'

const apiUrl = process.env.NEXT_PUBLIC_VETRO_API_URL
const isVetroApiConfigured = apiUrl !== undefined && isValidUrl(apiUrl)

// Temporary stub: there's no APY-history endpoint yet, so the `apy` metric still
// renders mocked MetricDataPoint[]. Re-wire it once a time series is available.

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

type TotalDepositsHistory = { timestamp: number; totalDeposits: string }[]

const fetchTotalDeposits = async function (
  shareToken: EvmToken,
  peggedToken: EvmToken,
  period: MetricPeriod,
): Promise<MetricDataPoint[]> {
  const stakingVault = getStakingVaultForShare(shareToken.address as Address)
  const history = (await fetch(
    `${apiUrl}/variable-stake/total-deposits-history/${stakingVault}/${period}`,
  )) as TotalDepositsHistory
  return history.map(({ timestamp, totalDeposits }) => ({
    x: timestamp,
    y: Number(formatUnits(BigInt(totalDeposits), peggedToken.decimals)),
  }))
}

type UseHistoricalMetrics = {
  metricType: MetricType
  peggedToken: EvmToken
  period: MetricPeriod
  shareToken: EvmToken
}

export const useHistoricalMetrics = ({
  metricType,
  peggedToken,
  period,
  shareToken,
}: UseHistoricalMetrics) =>
  useQuery({
    enabled: metricType === 'apy' || isVetroApiConfigured,
    queryFn: (): Promise<MetricDataPoint[]> =>
      metricType === 'apy'
        ? Promise.resolve(generateMockMetric(period, metricType))
        : fetchTotalDeposits(shareToken, peggedToken, period),
    queryKey: [
      'historical-metrics',
      metricType,
      period,
      peggedToken.address,
      shareToken.chainId,
      shareToken.address as Address,
    ],
  })
