import { type Hash, type TransactionReceipt } from 'viem'

type CommonEvents = {
  'unexpected-error': [Error]
}

export type ClaimRewardEvents = CommonEvents & {
  'claim-reward-failed': [Error]
  'claim-reward-failed-validation': [string]
  'claim-reward-settled': []
  'claim-reward-transaction-reverted': [TransactionReceipt]
  'claim-reward-transaction-succeeded': [TransactionReceipt]
  'pre-claim-reward': []
  'user-signed-claim-reward': [Hash]
  'user-signing-claim-reward-error': [Error]
}
