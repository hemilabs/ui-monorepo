import { type Hash, type TransactionReceipt } from 'viem'

type CommonEvents = {
  'unexpected-error': [Error]
}

type ApproveEvents = {
  'approve-transaction-reverted': [TransactionReceipt]
  'approve-transaction-succeeded': [TransactionReceipt]
  'check-allowance': []
  'pre-approve': []
  'user-signed-approval': [Hash]
  'user-signing-approval-error': [Error]
}

type QuoteEvents = {
  'pre-quote': []
  'quote-failed': [Error]
  'quote-succeeded': [bigint]
}

export type RequestDepositEvents = CommonEvents &
  ApproveEvents &
  QuoteEvents & {
    'deposit-failed': [Error]
    'deposit-failed-validation': [string]
    'deposit-settled': []
    'deposit-transaction-reverted': [TransactionReceipt]
    'deposit-transaction-succeeded': [TransactionReceipt]
    'pre-deposit': []
    'user-signed-deposit': [Hash]
    'user-signing-deposit-error': [Error]
  }

export type RequestRedeemEvents = CommonEvents &
  ApproveEvents &
  QuoteEvents & {
    'pre-withdraw': []
    'user-signed-withdraw': [Hash]
    'user-signing-withdraw-error': [Error]
    'withdraw-failed': [Error]
    'withdraw-failed-validation': [string]
    'withdraw-settled': []
    'withdraw-transaction-reverted': [TransactionReceipt]
    'withdraw-transaction-succeeded': [TransactionReceipt]
  }

// Mirrors the on-chain `Kind` enum from Router.sol (DEPOSIT = 0, REDEEM = 1).
export type RequestKind = 0 | 1

// Mirrors the on-chain `Status` enum from Router.sol
// (PENDING = 0, FULFILLED = 1, UNDONE = 2, FINALIZED = 3).
export type RequestStatus = 0 | 1 | 2 | 3
