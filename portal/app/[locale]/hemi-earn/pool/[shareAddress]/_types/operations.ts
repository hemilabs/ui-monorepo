import type { Hash } from 'viem'

// Prefer ordering these by value rather than by key
/* eslint-disable sort-keys */
export const DepositStatus = {
  APPROVAL_TX_PENDING: 0,
  APPROVAL_TX_FAILED: 1,
  APPROVAL_TX_COMPLETED: 2,
  DEPOSIT_TX_PENDING: 3,
  DEPOSIT_TX_FAILED: 4,
  DEPOSIT_TX_CONFIRMED: 5,
} as const
/* eslint-enable sort-keys */

export type DepositStatusType =
  (typeof DepositStatus)[keyof typeof DepositStatus]

export type DepositOperation = {
  amountIn?: string
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
  APPROVAL_TX_PENDING: 0,
  APPROVAL_TX_FAILED: 1,
  APPROVAL_TX_COMPLETED: 2,
  WITHDRAW_TX_PENDING: 3,
  WITHDRAW_TX_FAILED: 4,
  // Local enum stops here; the cross-chain leg (fulfillment/claim) is tracked via the subgraph.
  WITHDRAW_TX_CONFIRMED: 5,
} as const
/* eslint-enable sort-keys */

export type WithdrawStatusType =
  (typeof WithdrawStatus)[keyof typeof WithdrawStatus]

export type WithdrawOperation = {
  amountIn?: string
  approvalTxHash?: Hash
  status: WithdrawStatusType
  transactionHash?: Hash
}

export type WithdrawOperationRunning =
  | 'approving'
  | 'failed'
  | 'idle'
  | 'withdrawing'
