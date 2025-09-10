import { Hash } from 'viem'

import { EvmToken } from './token'

export type StakingDashboardToken = EvmToken

export const enum StakingDashboardStatus {
  // The Approval TX is sent but not confirmed.
  APPROVAL_TX_PENDING = 0,
  // The Approval TX failed to be confirmed.
  APPROVAL_TX_FAILED = 1,
  // Once the Approval TX is confirmed, but the user hasn't sent the createLoc Transaction
  APPROVAL_TX_COMPLETED = 2,
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  STAKE_TX_PENDING = 3,
  // CreateLock tx reverted
  STAKE_TX_FAILED = 4,
  // Transaction createLock confirmed
  STAKE_TX_CONFIRMED = 5,
}

export type StakingDashboardOperation = {
  approvalTxHash?: Hash
  transactionHash?: Hash
  status?: StakingDashboardStatus
}

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
  tokenId: string
  transactionHash: Hash
  transferable: boolean
}

export const enum UnstakingDashboardStatus {
  // The user has confirmed the TX in their wallet, but it hasn't been included in a block
  UNSTAKE_TX_PENDING = 0,
  // Withdrawal tx reverted
  UNSTAKE_TX_FAILED = 1,
  // Transaction withdrawal confirmed
  UNSTAKE_TX_CONFIRMED = 2,
}

export type UnstakingDashboardOperation = {
  transactionHash?: Hash
  stakingPosition?: Pick<StakingPosition, 'amount' | 'tokenId'>
  status?: UnstakingDashboardStatus
}
