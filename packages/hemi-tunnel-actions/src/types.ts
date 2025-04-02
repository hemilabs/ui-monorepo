import { type Hash, TransactionReceipt } from 'viem'

export type DepositEvents = {
  'deposit-failed': [Error]
  'deposit-failed-validation': [string]
  'on-deposit-settled': []
  'deposit-transaction-reverted': [TransactionReceipt]
  'deposit-transaction-succeeded': [TransactionReceipt]
  'on-deposit': []
  'user-signed-deposit': [Hash]
  'user-signing-deposit-error': [Error]
}

export type DepositErc20TokenEvents = DepositEvents & {
  'approve-failed': [Error]
  'approve-transaction-succeeded': [TransactionReceipt]
  'approve-transaction-reverted': [TransactionReceipt]
  'on-approve': []
  'user-signed-approve': [Hash]
  'user-signing-approve-error': [Error]
}
