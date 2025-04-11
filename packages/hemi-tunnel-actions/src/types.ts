import { type Hash, TransactionReceipt } from 'viem'

export type DepositEvents = {
  'deposit-failed': [Error]
  'deposit-failed-validation': [string]
  'deposit-settled': []
  'deposit-transaction-reverted': [TransactionReceipt]
  'deposit-transaction-succeeded': [TransactionReceipt]
  'pre-deposit': []
  'unexpected-error': [Error]
  'user-signed-deposit': [Hash]
  'user-signing-deposit-error': [Error]
}

export type DepositErc20Events = DepositEvents & {
  'approve-failed': [Error]
  'approve-transaction-succeeded': [TransactionReceipt]
  'approve-transaction-reverted': [TransactionReceipt]
  'pre-approve': []
  'user-signed-approve': [Hash]
  'user-signing-approve-error': [Error]
}

export type WithdrawEvents = {
  'pre-withdraw': []
  'unexpected-error': [Error]
  'user-signed-withdraw': [Hash]
  'user-signing-withdraw-error': [Error]
  'withdraw-failed': [Error]
  'withdraw-settled': []
  'withdraw-transaction-reverted': [TransactionReceipt]
  'withdraw-transaction-succeeded': [TransactionReceipt]
  'withdraw-failed-validation': [string]
}
