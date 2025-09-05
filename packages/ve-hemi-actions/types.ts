import { type Hash, type TransactionReceipt } from 'viem'

type CommonEvents = {
  'unexpected-error': [Error]
}

export type ApprovalEvents = {
  'approve-failed': [Error]
  'approve-transaction-reverted': [TransactionReceipt]
  'approve-transaction-succeeded': [TransactionReceipt]
  'pre-approve': []
  'user-signed-approve': [Hash]
  'user-signing-approve-error': [Error]
}

export type CreateLockEvents = CommonEvents &
  ApprovalEvents & {
    'lock-creation-failed': [Error]
    'lock-creation-failed-validation': [string]
    'lock-creation-settled': []
    'lock-creation-transaction-reverted': [TransactionReceipt]
    'lock-creation-transaction-succeeded': [TransactionReceipt]
    'pre-lock-creation': []
    'user-signed-lock-creation': [Hash]
    'user-signing-lock-creation-error': [Error]
  }

export type IncreaseAmountEvents = CommonEvents &
  ApprovalEvents & {
    'increase-amount-failed': [Error]
    'increase-amount-failed-validation': [string]
    'increase-amount-settled': []
    'increase-amount-transaction-reverted': [TransactionReceipt]
    'increase-amount-transaction-succeeded': [TransactionReceipt]
    'pre-increase-amount': []
    'user-signed-increase-amount': [Hash]
    'user-signing-increase-amount-error': [Error]
  }

export type IncreaseUnlockTimeEvents = CommonEvents & {
  'increase-unlock-time-failed': [Error]
  'increase-unlock-time-failed-validation': [string]
  'increase-unlock-time-settled': []
  'increase-unlock-time-transaction-reverted': [TransactionReceipt]
  'increase-unlock-time-transaction-succeeded': [TransactionReceipt]
  'pre-increase-unlock-time': []
  'user-signed-increase-unlock-time': [Hash]
  'user-signing-increase-unlock-time-error': [Error]
}

export type WithdrawEvents = CommonEvents & {
  'withdraw-failed': [Error]
  'withdraw-failed-validation': [string]
  'withdraw-settled': []
  'withdraw-transaction-reverted': [TransactionReceipt]
  'withdraw-transaction-succeeded': [TransactionReceipt]
  'pre-withdraw': []
  'user-signed-withdraw': [Hash]
  'user-signing-withdraw-error': [Error]
}
