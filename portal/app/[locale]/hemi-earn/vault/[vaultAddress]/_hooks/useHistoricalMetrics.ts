import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { type EvmToken } from 'types/token'
import { getTokenPrice } from 'utils/token'
import { isValidUrl } from 'utils/url'
import { type Address } from 'viem'

import {
  calculateTvlHistory,
  type VaultHistoryPoint,
} from '../../../_utils/vaultHistory'
import { type MetricPeriod, type MetricType } from '../../../types'

const subgraphApiUrl = process.env.NEXT_PUBLIC_SUBGRAPHS_API_URL

type VaultHistoryResponse = {
  history: VaultHistoryPoint[]
}

const fetchVaultHistory = (
  chainId: EvmToken['chainId'],
  vaultAddress: Address,
  period: MetricPeriod,
) =>
  fetch(`${subgraphApiUrl}/${chainId}/earn/vaults/${vaultAddress}/history`, {
    method: 'GET',
    queryString: { period },
  }).then((data: VaultHistoryResponse) => data.history)

// TODO: replace mock APY with real calculation from shareValue once approach is defined
const generateMockApyData = (history: VaultHistoryPoint[]) =>
  history.map(function ({ timestamp }, i) {
    const x = Math.sin(i + 100) * 10000
    const random = x - Math.floor(x)
    return {
      x: Number(timestamp) * 1000,
      y: 2 + random * 3,
    }
  })

type UseHistoricalMetrics = {
  metricType: MetricType
  period: MetricPeriod
  token: EvmToken
  vaultAddress: Address
}

export const useHistoricalMetrics = function ({
  metricType,
  period,
  token,
  vaultAddress,
}: UseHistoricalMetrics) {
  const { data: prices } = useTokenPrices()
  const tokenPrice = getTokenPrice(token, prices)

  return useQuery({
    enabled: subgraphApiUrl !== undefined && isValidUrl(subgraphApiUrl),
    queryFn: () => fetchVaultHistory(token.chainId, vaultAddress, period),
    queryKey: ['historical-metrics', period, token.chainId, vaultAddress],
    select(history) {
      if (metricType === 'deposits') {
        return calculateTvlHistory(history, token.decimals, tokenPrice)
      }
      // TODO: replace mock APY with real calculation from shareValue once approach is defined
      return generateMockApyData(history)
    },
  })
}
