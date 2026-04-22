import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { type EvmToken } from 'types/token'
import { getTokenPrice } from 'utils/token'
import { isValidUrl } from 'utils/url'
import { type Address, type Chain } from 'viem'

import {
  calculateTvlHistory,
  type VaultHistoryPoint,
} from '../../../_utils/vaultHistory'
import { type MetricPeriod, type MetricType } from '../../../types'

const subgraphApiUrl = process.env.NEXT_PUBLIC_SUBGRAPHS_API_URL

type VaultHistoryResponse = {
  history: VaultHistoryPoint[]
}

// TODO: replace mock APY data with real calculation from shareValue once approach is defined
const periodDurations: Record<MetricPeriod, number> = {
  '1m': 30 * 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1y': 365 * 24 * 60 * 60 * 1000,
  '3m': 90 * 24 * 60 * 60 * 1000,
}

const seededRandom = function (seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const generateMockApyData = function (period: MetricPeriod) {
  const now = Date.now()
  const duration = periodDurations[period]
  const points = 20
  const step = duration / (points - 1)

  return Array.from({ length: points }, function (_, i) {
    const random = seededRandom(i + 100)
    return {
      x: now - duration + i * step,
      y: 2 + random * 3,
    }
  })
}

const fetchVaultHistory = (
  chainId: Chain['id'],
  vaultAddress: Address,
  period: MetricPeriod,
) =>
  fetch(`${subgraphApiUrl}/${chainId}/earn/vaults/${vaultAddress}/history`, {
    method: 'GET',
    queryString: { period },
  }).then((data: VaultHistoryResponse) => data.history) as Promise<
    VaultHistoryPoint[]
  >

type UseHistoricalMetrics = {
  chainId: Chain['id']
  metricType: MetricType
  period: MetricPeriod
  token: EvmToken
  vaultAddress: Address
}

export const useHistoricalMetrics = function ({
  chainId,
  metricType,
  period,
  token,
  vaultAddress,
}: UseHistoricalMetrics) {
  const { data: prices } = useTokenPrices()

  return useQuery({
    enabled:
      subgraphApiUrl !== undefined &&
      isValidUrl(subgraphApiUrl) &&
      prices !== undefined,
    async queryFn() {
      if (metricType === 'apy') {
        // TODO: replace mock APY data with real calculation from shareValue once approach is defined
        return generateMockApyData(period)
      }

      const history = await fetchVaultHistory(chainId, vaultAddress, period)
      const tokenPrice = getTokenPrice(token, prices)
      return calculateTvlHistory(history, token.decimals, tokenPrice)
    },
    queryKey: ['historical-metrics', chainId, vaultAddress, period, metricType],
  })
}
