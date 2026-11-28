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
  'approve-transaction-reverted': [TransactionReceipt]
  'approve-transaction-succeeded': [TransactionReceipt]
  'pre-approve': []
  'user-signed-approve': [Hash]
  'user-signing-approve-error': [Error]
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

export type ProveEvents = CommonEvents & {
  'pre-prove': []
  'prove-failed': [Error]
  'prove-failed-validation': [string]
  'prove-settled': []
  'prove-transaction-reverted': [TransactionReceipt]
  'prove-transaction-succeeded': [TransactionReceipt]
  'user-signed-prove': [Hash]
  'user-signed-prove-error': [Error]
}

export type FinalizeEvents = CommonEvents & {
  'finalize-failed': [Error]
  'finalize-failed-validation': [string]
  'finalize-settled': []
  'finalize-transaction-reverted': [TransactionReceipt]
  'finalize-transaction-succeeded': [TransactionReceipt]
  'pre-finalize': []
  'user-signed-finalize': [Hash]
  'user-signed-finalize-error': [Error]
}
