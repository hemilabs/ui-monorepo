import { Address, Hash } from 'viem'

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

// Where a reward comes from. The Portal reads and claims one source today, but every
// figure and every claim plan is built as a list so a second contract only adds an entry.
export const RewardSource = {
  EPOCH: 'epoch',
} as const

export type RewardSourceType = (typeof RewardSource)[keyof typeof RewardSource]

export type ClaimableReward = {
  amount: bigint
  decimals: number
  source: RewardSourceType
  symbol: string
  token: Address
}

export type ClaimTransaction = {
  fromEpoch: number
  source: RewardSourceType
  toEpoch: number
}

// Prefer ordering these by value rather than by key
/* eslint-disable sort-keys */
export const CollectAllRewardsDashboardStatus = {
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  COLLECT_TX_PENDING: 0,
  // Withdrawal tx reverted
  COLLECT_TX_FAILED: 1,
  // Transaction withdrawal confirmed
  COLLECT_TX_CONFIRMED: 2,
} as const
/* eslint-enable sort-keys */

export type CollectAllRewardsDashboardStatusType =
  (typeof CollectAllRewardsDashboardStatus)[keyof typeof CollectAllRewardsDashboardStatus]

export type CollectAllRewardsStep = ClaimTransaction & {
  status?: CollectAllRewardsDashboardStatusType
  transactionHash?: Hash
}

export type CollectAllRewardsDashboardOperation = {
  transactionHash?: Hash
  rewards?: ClaimableReward[]
  stakingPosition?: Pick<StakingPosition, 'amount' | 'tokenId'>
  status?: CollectAllRewardsDashboardStatusType
  steps?: CollectAllRewardsStep[]
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
} as const
/* eslint-enable sort-keys */

export type UnlockingDashboardStatusType =
  (typeof UnlockingDashboardStatus)[keyof typeof UnlockingDashboardStatus]

/* eslint-disable sort-keys */
export const CaptureDashboardStatus = {
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  CAPTURE_TX_PENDING: 0,
  // Capture tx reverted
  CAPTURE_TX_FAILED: 1,
  // Transaction capture confirmed
  CAPTURE_TX_CONFIRMED: 2,
} as const
/* eslint-enable sort-keys */

export type CaptureDashboardStatusType =
  (typeof CaptureDashboardStatus)[keyof typeof CaptureDashboardStatus]

export type UnlockingDashboardOperation = {
  captureStatus?: CaptureDashboardStatusType
  captureTransactionHash?: Hash
  needsCapture?: boolean
  transactionHash?: Hash
  stakingPosition?: Pick<StakingPosition, 'amount' | 'tokenId'>
  status?: UnlockingDashboardStatusType
}
export type UnlockingOperationRunning = 'idle' | 'unlocking' | 'failed'
export type StakingOperationRunning =
  | 'idle'
  | 'approving'
  | 'staking'
  | 'staked'
  | 'failed'
