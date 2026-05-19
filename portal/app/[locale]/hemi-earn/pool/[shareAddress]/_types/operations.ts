import type { Hash } from 'viem'

// Prefer ordering these by value rather than by key
/* eslint-disable sort-keys */
export const DepositStatus = {
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

export type DepositStatusType =
  (typeof DepositStatus)[keyof typeof DepositStatus]

export type DepositOperation = {
  approvalTxHash?: Hash
  status: DepositStatusType
  transactionHash?: Hash
}

export type DepositOperationRunning =
  | 'approving'
  | 'depositing'
  | 'failed'
  | 'idle'

// Prefer ordering these by value rather than by key
/* eslint-disable sort-keys */
export const WithdrawStatus = {
  // The user has signed the share approval but it's not yet mined.
  APPROVAL_TX_PENDING: 0,
  // The share approval transaction reverted or was rejected.
  APPROVAL_TX_FAILED: 1,
  // The share approval is confirmed; the redeem transaction can be sent.
  APPROVAL_TX_COMPLETED: 2,
  // The user has confirmed the redeem TX but it hasn't been included in a block.
  WITHDRAW_TX_PENDING: 3,
  // The redeem TX reverted.
  WITHDRAW_TX_FAILED: 4,
  // The redeem TX is confirmed (request is now in flight cross-chain — UI stops
  // tracking here; LayerZero fulfillment / claim are out of scope for phase 2).
  WITHDRAW_TX_CONFIRMED: 5,
} as const
/* eslint-enable sort-keys */

export type WithdrawStatusType =
  (typeof WithdrawStatus)[keyof typeof WithdrawStatus]

export type WithdrawOperation = {
  approvalTxHash?: Hash
  status: WithdrawStatusType
  transactionHash?: Hash
}

export type WithdrawOperationRunning =
  | 'approving'
  | 'failed'
  | 'idle'
  | 'withdrawing'
