import { type Hash, TransactionReceipt } from 'viem'

// Common events for all TGE claim operations
type CommonEvents = {
  'unexpected-error': [Error]
}

// Claim operation events
export type ClaimEvents = CommonEvents & {
  'claim-failed': [Error]
  'claim-failed-validation': [string]
  'claim-settled': []
  'claim-transaction-reverted': [TransactionReceipt]
  'claim-transaction-succeeded': [TransactionReceipt]
  'pre-claim': []
  'user-signed-claim': [Hash]
  'user-signing-claim-error': [Error]
}

// Claim option types as defined in requirements
// "user-selection" means the user can select, but for the others it means the option is fixed
export type ClaimOption =
  | 'standard'
  | 'hybrid'
  | 'full-stake'
  | 'user-selection'

export const lockupOptions = {
  // I prefer to sort these in time-based order
  /* eslint-disable sort-keys */
  sixMonths: 6,
  twoYears: 24,
  fourYears: 48,
  /* eslint-enable sort-keys */
} as const

export const lockupMonths = [
  lockupOptions.sixMonths,
  lockupOptions.twoYears,
  lockupOptions.fourYears,
] as const
export type LockupMonths = (typeof lockupMonths)[number]

// Eligibility data structure
export type EligibilityData = {
  address: string
  amount: string
  claimGroupId: number
  option: ClaimOption
  proof: Hash[]
}
