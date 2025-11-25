import type { Address, Hash } from 'viem'

export type Strategy = {
  address: Address
  name: string
  weight: bigint
}

export type Vault = {
  address: Address
  strategies: Strategy[] | undefined
}

// Prefer ordering these by value rather than by key
/* eslint-disable sort-keys */
export const BitcoinYieldDepositStatus = {
  // The Approval TX is sent but not confirmed.
  APPROVAL_TX_PENDING: 0,
  // The Approval TX failed to be confirmed.
  APPROVAL_TX_FAILED: 1,
  // Once the Approval TX is confirmed, but the user hasn't sent the deposit Transaction
  APPROVAL_TX_COMPLETED: 2,
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  DEPOSIT_TX_PENDING: 3,
  // Deposit tx reverted
  DEPOSIT_TX_FAILED: 4,
  // Transaction deposit confirmed
  DEPOSIT_TX_CONFIRMED: 5,
} as const
/* eslint-enable sort-keys */

export type BitcoinYieldDepositStatusType =
  (typeof BitcoinYieldDepositStatus)[keyof typeof BitcoinYieldDepositStatus]

export type BitcoinYieldDepositOperation = {
  approvalTxHash?: Hash
  transactionHash?: Hash
  status: BitcoinYieldDepositStatusType
}

// Prefer ordering these by value rather than by key
/* eslint-disable sort-keys */
export const BitcoinYieldWithdrawalStatus = {
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  WITHDRAW_TX_PENDING: 0,
  // Withdraw tx reverted
  WITHDRAW_TX_FAILED: 1,
  // Transaction withdraw confirmed
  WITHDRAW_TX_CONFIRMED: 2,
} as const
/* eslint-enable sort-keys */

export type BitcoinYieldWithdrawalStatusType =
  (typeof BitcoinYieldWithdrawalStatus)[keyof typeof BitcoinYieldWithdrawalStatus]

export type BitcoinYieldWithdrawalOperation = {
  transactionHash?: Hash
  status: BitcoinYieldWithdrawalStatusType
}

// Prefer ordering these by value rather than by key
/* eslint-disable sort-keys */
export const BitcoinYieldClaimRewardStatus = {
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  CLAIM_REWARD_TX_PENDING: 0,
  // Claim reward tx reverted
  CLAIM_REWARD_TX_FAILED: 1,
  // Transaction claim reward confirmed
  CLAIM_REWARD_TX_CONFIRMED: 2,
} as const
/* eslint-enable sort-keys */

export type BitcoinYieldClaimRewardStatusType =
  (typeof BitcoinYieldClaimRewardStatus)[keyof typeof BitcoinYieldClaimRewardStatus]

export type BitcoinYieldClaimRewardOperation = {
  transactionHash?: Hash
  status: BitcoinYieldClaimRewardStatusType
}

export type PoolRewards =
  | []
  | readonly [
      // array of token addresses that are rewarded
      Address[],
      // array of amounts rewarded for each token
      bigint[],
    ]
