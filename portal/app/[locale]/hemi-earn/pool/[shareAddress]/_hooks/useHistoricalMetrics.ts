import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
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

type ApyHistory = { apy: number; timestamp: number }[]

const fetchApyHistory = async function ({
  period,
  stakingVault,
}: {
  period: MetricPeriod
  stakingVault: Address
}): Promise<MetricDataPoint[]> {
  const history = (await fetch(
    `${apiUrl}/variable-stake/apy-history/${stakingVault}/${period}`,
  )) as ApyHistory
  return history.map(({ apy, timestamp }) => ({ x: timestamp, y: apy }))
}

type TotalDepositsHistory = { timestamp: number; totalDeposits: string }[]

const fetchTotalDeposits = async function ({
  peggedToken,
  period,
  stakingVault,
}: {
  peggedToken: EvmToken
  period: MetricPeriod
  stakingVault: Address
}): Promise<MetricDataPoint[]> {
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
  stakingVault: Address
}

export const useHistoricalMetrics = ({
  metricType,
  peggedToken,
  period,
  shareToken,
  stakingVault,
}: UseHistoricalMetrics) =>
  useQuery({
    enabled: isVetroApiConfigured,
    queryFn: (): Promise<MetricDataPoint[]> =>
      metricType === 'apy'
        ? fetchApyHistory({ period, stakingVault })
        : fetchTotalDeposits({ peggedToken, period, stakingVault }),
    queryKey: [
      'historical-metrics',
      metricType,
      period,
      peggedToken.address,
      shareToken.chainId,
      shareToken.address as Address,
      stakingVault,
    ],
  })
