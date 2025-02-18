import { type EvmToken, type Extensions } from 'token-list'
import { Address } from 'viem'

export const stakeProtocols = [
  'bedRock',
  'bitFi',
  'exSat',
  'hemi',
  'lorenzo',
  'merlinChain',
  'nodeDao',
  'pumpBtc',
  'solv',
  'stakeStone',
  'uniRouter',
] as const

export type StakeProtocols = (typeof stakeProtocols)[number]

export type Reward =
  | 'bedrock'
  | 'bitfi'
  | 'bsquared'
  | 'hemi'
  | 'lorenzo'
  | 'pumpbtc'
  | 'solv'
  | 'unirouter'

export type StakeExtensions = Omit<Extensions, 'protocol'> & {
  protocol: StakeProtocols
  rewards: Reward[]
  website: string
}

export type StakeToken = Omit<EvmToken, 'address'> & {
  // we can override Address because we only stake erc20 (native tokens excluded), so we know for sure
  // that address is of Address type
  address: Address
  // EvmToken has a broad definition of "protocol", but for StakeToken let's make a
  // defined list of protocols that make a token a Stake one.
  extensions: StakeExtensions
}

export type StakeOperations = 'stake' | 'unstake'

/**
 * Use this enum to follow the Stake operation. The user starts on STAKE_TX_PENDING if
 * the token doesn't require an approval to stake. If an approval is needed, the entry point is
 * APPROVAL_TX_PENDING.
 * Example flow of the state:
 * APPROVAL_TX_PENDING Start here if the token to deposit requires an approval
 *  |_ APPROVAL_TX_FAILED The approval Tx failed - the user can retry.
 *  |_ APPROVAL_TX_COMPLETED Once the Approval TX is confirmed, but the user hasn't sent the Deposit Transaction.
 *    |_ STAKE_TX_PENDING The stake transaction is pending. User can start here if approval wasn't required.
 *      |_ STAKE_TX_FAILED The stake transaction failed. The user can retry.
 *      |_ STAKE_TX_CONFIRMED The stake transaction was confirmed. The user has now a staked position.
 */
export const enum StakeStatusEnum {
  // The Approval TX is sent but not confirmed.
  APPROVAL_TX_PENDING = 0,
  // The Approval TX failed to be confirmed.
  APPROVAL_TX_FAILED = 1,
  // Once the Approval TX is confirmed, but the user hasn't sent the Deposit Transaction
  APPROVAL_TX_COMPLETED = 2,
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  STAKE_TX_PENDING = 3,
  // Deposit tx reverted
  STAKE_TX_FAILED = 4,
  // Transaction deposit confirmed
  STAKE_TX_CONFIRMED = 5,
}

export const enum UnstakeStatusEnum {
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  UNSTAKE_TX_PENDING = 0,
  // The unstake transaction reverted
  UNSTAKE_TX_FAILED = 1,
  // Unstake transaction confirmed
  UNSTAKE_TX_CONFIRMED = 2,
}
