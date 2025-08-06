import { Chain, Hash } from 'viem'

import { type EvmToken, type Extensions } from './token'

/**
 * // TODO - This types are not fully defined yet.
 *
 */
export type StakingDashboardToken = EvmToken & {
  extensions: Omit<Extensions, 'protocol'>
}

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
