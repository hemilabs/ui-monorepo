import { type EvmToken } from 'types/token'
import { type Address } from 'viem'

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
  vaultAddress: Address
  token: EvmToken
  apy: { base: number; incentivized: number; total: number }
  totalDeposits: bigint
  exposureTokens: { address: Address; chainId: EvmToken['chainId'] }[]
}

export type EarnPosition = {
  vaultAddress: Address
  token: EvmToken
  apy: { base: number; incentivized: number; total: number }
  yourDeposit: bigint
  yieldEarned: string
}
