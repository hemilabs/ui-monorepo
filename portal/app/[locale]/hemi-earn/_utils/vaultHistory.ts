import Big from 'big.js'
import { formatUnits } from 'viem'

import { type MetricDataPoint } from '../types'

export type VaultHistoryPoint = {
  shareValue: string
  timestamp: string
  totalAssets: string
}

export const calculateTvlHistory = (
  history: VaultHistoryPoint[],
  tokenDecimals: number,
  tokenPrice: string,
): MetricDataPoint[] =>
  history.map(function ({ timestamp, totalAssets }) {
    const assets = formatUnits(BigInt(totalAssets), tokenDecimals)
    const tvl = Big(assets).times(tokenPrice).toNumber()
    return {
      x: Number(timestamp) * 1000, // To milliseconds
      y: tvl,
    }
  })
