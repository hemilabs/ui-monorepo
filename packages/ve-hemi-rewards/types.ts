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
