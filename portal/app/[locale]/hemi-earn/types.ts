export type VaultBreakdown = {
  name: string
  tokenAddress: string
  tokenChainId: number
  value: string
}

export type EarnCardData = {
  vaultBreakdown: VaultBreakdown[]
  vaultCount: number
}
