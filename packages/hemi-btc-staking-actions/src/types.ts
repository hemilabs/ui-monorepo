import { type Hash, type TransactionReceipt } from 'viem'

type CommonEvents = {
  'unexpected-error': [Error]
}

export type DepositEvents = CommonEvents & {
  'approve-transaction-succeeded': [TransactionReceipt]
  'approve-transaction-reverted': [TransactionReceipt]
  'check-allowance': []
  'deposit-failed': [Error]
  'deposit-failed-validation': [string]
  'deposit-settled': []
  'deposit-transaction-reverted': [TransactionReceipt]
  'deposit-transaction-succeeded': [TransactionReceipt]
  'pre-approve': []
  'pre-deposit': []
  'user-signed-approval': [Hash]
  'user-signed-deposit': [Hash]
  'user-signing-approval-error': [Error]
  'user-signing-deposit-error': [Error]
}

export type WithdrawEvents = CommonEvents & {
  'pre-withdraw': []
  'user-signed-withdraw': [Hash]
  'user-signing-withdraw-error': [Error]
  'withdraw-failed': [Error]
  'withdraw-failed-validation': [string]
  'withdraw-settled': []
  'withdraw-transaction-reverted': [TransactionReceipt]
  'withdraw-transaction-succeeded': [TransactionReceipt]
}
