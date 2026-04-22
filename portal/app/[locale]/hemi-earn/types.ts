import { type EvmToken } from 'types/token'
import { type Address } from 'viem'

export type MetricDataPoint = { x: number; y: number }
export type MetricPeriod = '1w' | '1m' | '3m' | '1y'
export type MetricType = 'deposits' | 'apy'

export type VaultToken = {
  token: EvmToken
  vaultAddress: Address
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
  exposureTokens: { address: Address; chainId: EvmToken['chainId'] }[]
  token: EvmToken
  totalDeposits: bigint
  vaultAddress: Address
}

export type EarnPosition = {
  apy: { base: number; incentivized: number; total: number }
  token: EvmToken
  vaultAddress: Address
  yieldEarned: string
  yourDeposit: bigint
}
