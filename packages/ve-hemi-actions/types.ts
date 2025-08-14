import { type Hash, type TransactionReceipt } from 'viem'

type CommonEvents = {
  'unexpected-error': [Error]
}

export type CreateLockEvents = CommonEvents & {
  'approve-failed': [Error]
  'approve-transaction-reverted': [TransactionReceipt]
  'approve-transaction-succeeded': [TransactionReceipt]
  'lock-creation-failed': [Error]
  'lock-creation-failed-validation': [string]
  'lock-creation-settled': []
  'lock-creation-transaction-reverted': [TransactionReceipt]
  'lock-creation-transaction-succeeded': [TransactionReceipt]
  'pre-approve': []
  'pre-lock-creation': []
  'user-signed-approve': [Hash]
  'user-signed-lock-creation': [Hash]
  'user-signing-approve-error': [Error]
  'user-signing-lock-creation-error': [Error]
}
