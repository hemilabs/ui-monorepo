import { type EvmToken, type Extensions } from './token'

export const stakeProtocols = [
  'babypie',
  'bedRock',
  'bitFi',
  'circle',
  'egEth',
  'ethereum',
  'exSat',
  'hemi',
  'kelp',
  'lorenzo',
  'makerDao',
  'merlinChain',
  'obeliskNodeDao',
  'pumpBtc',
  'river',
  'sumer',
  'solv',
  'tether',
  'tetherGold',
  'threshold',
  'uniBtc',
  'uniRouter',
  'wbtc',
  'yieldNest',
] as const

export type StakeProtocols = (typeof stakeProtocols)[number]

export type StakeExtensions = Omit<Extensions, 'protocol'> & {
  protocol: StakeProtocols
  rewards: string[]
  website: string
}

export type StakeToken = EvmToken & {
  balance?: bigint
  // EvmToken has a broad definition of "protocol", but for StakeToken let's make a
  // defined list of protocols that make a token a Stake one.
  extensions: StakeExtensions
}

export const priorityStakeTokensToSort = ['hemiBTC', 'USDT', 'USDC']

/* eslint-disable sort-keys */
export const UnstakeStatusEnum = {
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  UNSTAKE_TX_PENDING: 0,
  // The unstake transaction reverted
  UNSTAKE_TX_FAILED: 1,
  // Unstake transaction confirmed
  UNSTAKE_TX_CONFIRMED: 2,
} as const
/* eslint-enable sort-keys */

export type UnstakeStatusEnumType =
  (typeof UnstakeStatusEnum)[keyof typeof UnstakeStatusEnum]
