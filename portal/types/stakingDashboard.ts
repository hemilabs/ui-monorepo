import { Chain, Hash } from 'viem'

export type StakingDashboardOperation = {
  amount: string
  transactionHash: Hash
  apy: string
  chainId: Chain['id']
  lockupPeriod: string
  timeRemaining: string
  token: string
  percentageRemaining: number
}
