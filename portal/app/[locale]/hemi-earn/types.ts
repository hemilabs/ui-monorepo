import { type Token } from 'types/token'
import { type Address, type Chain } from 'viem'

export type VaultBreakdown = {
  name: string
  tokenAddress: string
  tokenChainId: Chain['id']
  value: string
}

export type EarnCardData = {
  vaultBreakdown: VaultBreakdown[]
  vaultCount: number
}

export type EarnPool = {
  vaultAddress: Address
  token: Token
  apy: { base: number; incentivized: number; total: number }
  totalDeposits: bigint
  exposureTokens: { address: string; chainId: Chain['id'] }[]
}

export type EarnPosition = {
  vaultAddress: Address
  token: Token
  apy: { base: number; incentivized: number; total: number }
  yourDeposit: bigint
  yieldEarned: string
}
