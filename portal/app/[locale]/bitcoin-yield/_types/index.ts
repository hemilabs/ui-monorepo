import { Hash } from 'viem'

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
