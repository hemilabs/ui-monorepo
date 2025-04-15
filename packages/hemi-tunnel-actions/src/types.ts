import { type Hash, TransactionReceipt } from 'viem'

type CommonEvents = {
  'unexpected-error': [Error]
}

export type DepositEvents = CommonEvents & {
  'deposit-failed': [Error]
  'deposit-failed-validation': [string]
  'deposit-settled': []
  'deposit-transaction-reverted': [TransactionReceipt]
  'deposit-transaction-succeeded': [TransactionReceipt]
  'pre-deposit': []
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

export type WithdrawEvents = CommonEvents & {
  'pre-withdraw': []
  'user-signed-withdraw': [Hash]
  'user-signing-withdraw-error': [Error]
  'withdraw-failed': [Error]
  'withdraw-settled': []
  'withdraw-transaction-reverted': [TransactionReceipt]
  'withdraw-transaction-succeeded': [TransactionReceipt]
  'withdraw-failed-validation': [string]
}

export type ProveEvents = CommonEvents & {
  'pre-prove': []
  'prove-failed-validation': [string]
  'prove-failed': [Error]
  'prove-settled': []
  'prove-transaction-reverted': [TransactionReceipt]
  'prove-transaction-succeeded': [TransactionReceipt]
  'user-signed-prove': [Hash]
  'user-signed-prove-error': [Error]
}
