import { type Hash, type TransactionReceipt } from 'viem'

type CommonEvents = {
  'unexpected-error': [Error]
}

export type ClaimFromEvents = CommonEvents & {
  'claim-from-failed': [Error]
  'claim-from-failed-validation': [string]
  'claim-from-settled': []
  'claim-from-transaction-reverted': [TransactionReceipt]
  'claim-from-transaction-succeeded': [TransactionReceipt]
  'pre-claim-from': []
  'user-signed-claim-from': [Hash]
  'user-signing-claim-from-error': [Error]
}

export type CaptureAndWithdrawEvents = CommonEvents & {
  'capture-not-needed': []
  'capture-transaction-reverted': [TransactionReceipt]
  'capture-transaction-succeeded': [TransactionReceipt]
  'pre-capture': []
  'pre-withdraw': []
  'user-signed-capture': [Hash]
  'user-signed-withdraw': [Hash]
  'user-signing-capture-error': [Error]
  'user-signing-withdraw-error': [Error]
  'withdraw-failed': [Error]
  'withdraw-failed-validation': [string]
  'withdraw-settled': []
  'withdraw-transaction-reverted': [TransactionReceipt]
  'withdraw-transaction-succeeded': [TransactionReceipt]
}

export type ClaimTokenEvents = CommonEvents & {
  'claim-token-failed': [Error]
  'claim-token-failed-validation': [string]
  'claim-token-settled': []
  'claim-token-transaction-reverted': [TransactionReceipt]
  'claim-token-transaction-succeeded': [TransactionReceipt]
  'pre-claim-token': []
  'user-signed-claim-token': [Hash]
  'user-signing-claim-token-error': [Error]
}
