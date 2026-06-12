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

// Single-tx Router writes with no approval / no quote leg (claim & recover).
// The 4 settlement actions share the same shape — `getRequest` already lets
// the UI read the current `Status` to know which one to surface, so the
// event vocabulary is intentionally generic and reused via type aliases.
type SettlementEvents = {
  'pre-tx': []
  'tx-failed': [Error]
  'tx-failed-validation': [string]
  'tx-settled': []
  'tx-transaction-reverted': [TransactionReceipt]
  'tx-transaction-succeeded': [TransactionReceipt]
  'user-signed-tx': [Hash]
  'user-signing-tx-error': [Error]
}

export type ClaimDepositEvents = CommonEvents & SettlementEvents
export type ClaimRedeemEvents = CommonEvents & SettlementEvents
export type RecoverDepositEvents = CommonEvents & SettlementEvents
export type RecoverRedeemEvents = CommonEvents & SettlementEvents
// `Router.cancel(id)` only emits `CancellationRequested` and never moves the
// request out of PENDING — the user still needs to wait for the keeper-driven
// Agent cancel + `recoverRedeem` follow-ups. The event vocabulary still maps
// onto `SettlementEvents` because the tx flow here is identical: one Hemi
// write with no allowance / no quote.
export type CancelRedeemEvents = CommonEvents & SettlementEvents

// Mirrors the on-chain `Kind` enum from Router.sol (DEPOSIT = 0, REDEEM = 1).
export type RequestKind = 0 | 1

// Mirrors the on-chain `Status` enum from Router.sol
// (PENDING = 0, FULFILLED = 1, CANCELLED = 2, FINALIZED = 3).
export type RequestStatus = 0 | 1 | 2 | 3
