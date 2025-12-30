import type { Address, Hash, TransactionReceipt } from 'viem'

type CommonEvents = {
  'unexpected-error': [Error]
}

export type ClaimAllRewardsEvents = CommonEvents & {
  'claim-all-rewards-failed': [Error]
  'claim-all-rewards-failed-validation': [string]
  'claim-all-rewards-settled': []
  'claim-all-rewards-transaction-reverted': [TransactionReceipt]
  'claim-all-rewards-transaction-succeeded': [TransactionReceipt]
  'pre-claim-all-rewards': []
  'user-signed-claim-all-rewards': [Hash]
  'user-signing-claim-all-rewards-error': [Error]
}

export type ClaimReward = {
  account: Address
  amounts: bigint[]
  proofs: Hash[][]
  tokens: Address[]
  users: Address[]
}
