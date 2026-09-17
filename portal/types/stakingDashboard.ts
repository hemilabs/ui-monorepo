import { Hash } from 'viem'

import { EvmToken } from './token'

export type StakingDashboardToken = EvmToken

/* eslint-disable sort-keys */
export const StakingDashboardStatus = {
  // The Approval TX is sent but not confirmed.
  APPROVAL_TX_PENDING: 0,
  // The Approval TX failed to be confirmed.
  APPROVAL_TX_FAILED: 1,
  // Once the Approval TX is confirmed, but the user hasn't sent the createLoc Transaction
  APPROVAL_TX_COMPLETED: 2,
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  STAKE_TX_PENDING: 3,
  // CreateLock tx reverted
  STAKE_TX_FAILED: 4,
  // Transaction createLock confirmed
  STAKE_TX_CONFIRMED: 5,
} as const
/* eslint-enable sort-keys */

export type StakingDashboardStatusType =
  (typeof StakingDashboardStatus)[keyof typeof StakingDashboardStatus]

export const StakingPositionStatus = {
  ACTIVE: 'active',
  WITHDRAWN: 'withdrawn',
} as const

export type StakingPositionStatus =
  (typeof StakingPositionStatus)[keyof typeof StakingPositionStatus]

export type StakingPosition = {
  amount: bigint
  blockNumber: bigint
  blockTimestamp: bigint
  forfeitable: boolean
  id: string
  lockTime: bigint
  owner: string
  pastOwners: string[]
  status: StakingPositionStatus
  timestamp: bigint
  tokenId: bigint
  transactionHash: Hash
  transferable: boolean
}

export type StakingDashboardOperation = Partial<{
  approvalTxHash: Hash
  input: string
  inputDays: string
  lockupDays: number
  transactionHash: Hash
  stakingPosition: Partial<
    Pick<StakingPosition, 'amount' | 'tokenId' | 'lockTime' | 'timestamp'>
  >
  status: StakingDashboardStatusType
}>

// Prefer ordering these by value rather than by key
/* eslint-disable sort-keys */
export const CollectAllRewardsDashboardStatus = {
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  COLLECT_TX_PENDING: 0,
  // Withdrawal tx reverted
  COLLECT_TX_FAILED: 1,
  // Transaction withdrawal confirmed
  COLLECT_TX_CONFIRMED: 2,
  // The claim resolved and paid nothing, which is not a failure: a holder can settle
  // epochs they held no weight in. Nothing is sent on this path at all, so it is kept
  // apart from "confirmed" - a legitimate zero should not read as a missing payment.
  COLLECT_NOTHING_OWED: 3,
  // Between the click and the first wallet prompt. Planning the claim takes a few
  // seconds of reads, and without this the page sat unchanged for all of them.
  COLLECT_PREPARING: 4,
  // The holder declined the wallet prompt. Kept apart from FAILED so we don't tell
  // someone their claim broke when they simply changed their mind.
  COLLECT_REJECTED: 5,
} as const
/* eslint-enable sort-keys */

export type CollectAllRewardsDashboardStatusType =
  (typeof CollectAllRewardsDashboardStatus)[keyof typeof CollectAllRewardsDashboardStatus]

export type ClaimStepStatus =
  | 'confirmed'
  | 'declined'
  | 'failed'
  | 'signing'
  | 'waiting'

export type ClaimStep = {
  chunk: number
  chunks: number
  from: number
  status: ClaimStepStatus
  to: number
  transactionHash?: Hash
}

export type ClaimPositionOutcome =
  | 'declined'
  | 'failed'
  | 'nothing-owed'
  | 'paid'

export type ClaimWalkPosition = {
  amount: bigint
  outcome?: ClaimPositionOutcome
  steps: ClaimStep[]
  tokenId: bigint
}

// One asset's share of what a claim is collecting, summed over its positions. Read
// before anything is signed - a successful claim drives the live figures to zero, and
// "You receive 0" is a poor headline for a confirmation.
export type ClaimRewardTotal = {
  claimable: bigint
  // From the Lens row, not the token list. The registry mixes 18dp and 8dp assets and
  // the Lens reports the decimals next to the amount they belong to.
  decimals: number
  symbol: string
  token: string
}

export type CollectAllRewardsDashboardOperation = {
  transactionHash?: Hash
  // `owner` so the drawer's retry can re-check eligibility for itself. Absent for a
  // walk over several positions, which has no single position to name.
  stakingPosition?: Pick<StakingPosition, 'amount' | 'owner' | 'tokenId'>
  status?: CollectAllRewardsDashboardStatusType
  totals?: readonly ClaimRewardTotal[]
  // Every step of the claim, one position or all of them. See `_utils/claimWalk`.
  walk?: ClaimWalkPosition[]
}

// Prefer ordering these by value rather than by key
/* eslint-disable sort-keys */
export const UnlockingDashboardStatus = {
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  UNLOCK_TX_PENDING: 0,
  // Withdrawal tx reverted
  UNLOCK_TX_FAILED: 1,
  // Transaction withdrawal confirmed
  UNLOCK_TX_CONFIRMED: 2,
  // Recording the position's class, which has to land before the NFT is burned: a burn
  // without it leaves the unclaimed rewards permanently unpayable. Appended rather than
  // inserted so the existing numbering doesn't move.
  CAPTURE_TX_PENDING: 3,
  // The class was not recorded, so the withdrawal was not attempted
  CAPTURE_TX_FAILED: 4,
} as const
/* eslint-enable sort-keys */

export type UnlockingDashboardStatusType =
  (typeof UnlockingDashboardStatus)[keyof typeof UnlockingDashboardStatus]

export type UnlockingDashboardOperation = {
  transactionHash?: Hash
  // Set when the class turns out to need recording, so the drawer can show the extra
  // step. Absent means it was already on record and the unlock is one transaction.
  requiresClassCapture?: boolean
  stakingPosition?: Pick<StakingPosition, 'amount' | 'tokenId'>
  status?: UnlockingDashboardStatusType
}
export type CollectAllRewardsOperationRunning = 'idle' | 'collecting' | 'failed'
export type UnlockingOperationRunning = 'idle' | 'unlocking' | 'failed'
export type StakingOperationRunning =
  | 'idle'
  | 'approving'
  | 'staking'
  | 'staked'
  | 'failed'
