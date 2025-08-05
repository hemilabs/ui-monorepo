import { Hash } from 'viem'

import { type EvmToken, type Extensions } from './token'

/**
 * // TODO - This types are not fully defined yet.
 *
 */
export type StakingDashboardToken = EvmToken & {
  amount: string
  extensions: Omit<Extensions, 'protocol'>
  transaction: Hash
  apy: string
  lockupPeriod: string
  timeRemaining: string
  percentageRemaining: number
}
