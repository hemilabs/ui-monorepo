import { type Hash, type TransactionReceipt } from 'viem'

type CommonEvents = {
  'unexpected-error': [Error]
}

export type CollectAllRewardsEvents = CommonEvents & {
  'collect-all-rewards-failed': [Error]
  'collect-all-rewards-failed-validation': [string]
  'collect-all-rewards-settled': []
  'collect-all-rewards-transaction-reverted': [TransactionReceipt]
  'collect-all-rewards-transaction-succeeded': [TransactionReceipt]
  'pre-collect-all-rewards': []
  'user-signed-collect-all-rewards': [Hash]
  'user-signing-collect-all-rewards-error': [Error]
}

export type ClaimEpochRewardsProgress = {
  chunk: number
  chunks: number
  // The epochs this step settles, so a caller can keep a finished step on screen and
  // say what it covered.
  from: number
  to: number
}

export type ClaimEpochRewardsTokenEvents = CommonEvents & {
  'claim-epoch-token-chunk-reverted': [
    TransactionReceipt,
    ClaimEpochRewardsProgress,
  ]
  'claim-epoch-token-chunk-succeeded': [
    TransactionReceipt,
    ClaimEpochRewardsProgress,
  ]
  'claim-epoch-token-failed': [Error]
  'claim-epoch-token-failed-validation': [string]
  'claim-epoch-token-settled': []
  'nothing-to-claim': []
  'pre-claim-epoch-token': [ClaimEpochRewardsProgress]
  'user-signed-claim-epoch-token-chunk': [Hash, ClaimEpochRewardsProgress]
  'user-signing-claim-epoch-token-error': [Error]
}

export type ClaimEpochRewardsEvents = CommonEvents & {
  'claim-epoch-rewards-failed': [Error]
  'claim-epoch-rewards-failed-validation': [string]
  'claim-epoch-rewards-settled': []
  'claim-epoch-chunk-reverted': [TransactionReceipt, ClaimEpochRewardsProgress]
  'claim-epoch-chunk-succeeded': [TransactionReceipt, ClaimEpochRewardsProgress]
  'nothing-to-claim': []
  'pre-claim-epoch-chunk': [ClaimEpochRewardsProgress]
  'pre-claim-epoch-rewards': [ClaimEpochRewardsProgress]
  'user-signed-claim-epoch-chunk': [Hash, ClaimEpochRewardsProgress]
  'user-signing-claim-epoch-rewards-error': [Error]
}
