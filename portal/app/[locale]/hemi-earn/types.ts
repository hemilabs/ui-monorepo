import { type EvmToken } from 'types/token'
import { type Address } from 'viem'

export type MetricDataPoint = { x: number; y: number }
export type MetricPeriod = '1w' | '1m' | '3m' | '1y'
export type MetricType = 'deposits' | 'apy'

export type VaultToken = {
  assetAddress: Address
  token: EvmToken
}

export type VaultBreakdown = {
  name: string
  tokenAddress: string
  tokenChainId: EvmToken['chainId']
  value: string
}

export type EarnCardData = {
  vaultBreakdown: VaultBreakdown[]
  vaultCount: number
}

export type EarnPool = {
  apy: { base: number; incentivized: number; total: number }
  assetAddress: Address
  exposureTokens: { address: Address; chainId: EvmToken['chainId'] }[]
  token: EvmToken
  totalDeposits: bigint
}

export type EarnPosition = {
  apy: { base: number; incentivized: number; total: number }
  assetAddress: Address
  token: EvmToken
  yieldEarned: string
  yourDeposit: bigint
}
