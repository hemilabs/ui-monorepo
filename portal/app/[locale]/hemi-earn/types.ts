import { type QueryStatus } from '@tanstack/react-query'
import { type EvmToken } from 'types/token'
import { type Address, type Chain, type Hash } from 'viem'

import {
  type DepositOperation,
  type WithdrawOperation,
} from './pool/[shareAddress]/_types/operations'

export type MetricDataPoint = { x: number; y: number }
export type MetricPeriod = '1w' | '1m' | '3m' | '1y'
export type MetricType = 'deposits' | 'apy'

export type EarnTransactionStatusType =
  | 'PENDING'
  | 'FULFILLED'
  | 'FINALIZED'
  | 'CANCELLED'
  | 'RECOVERED'
  | 'TX_PENDING'
  | 'FAILED'

export type EarnTransactionKindType = 'DEPOSIT' | 'REDEEM'

// A locally-tracked settlement tx the user signed (not a subgraph event). UNSTAKE
// is Agent.claimUnstake; RETRY/CANCEL_REQUEST are Agent.retry/cancel on a remote
// failure; failed lets the UI offer a Retry.
export type EarnSettlement = {
  failed: boolean
  kind: 'CLAIM' | 'RECOVER' | 'CANCEL' | 'UNSTAKE' | 'RETRY' | 'CANCEL_REQUEST'
  txHash?: Hash
}

// Subgraph Request row; bigints arrive as JSON strings. TX_PENDING/FAILED are
// portal-synthetic statuses (not in the subgraph schema).
export type EarnTransaction = {
  amountIn: string
  amountOut: string | null
  // Only present on local-store rows; the indexer can't tie an approval tx to a request.
  approvalTxHash?: Hash
  asset: Address
  automatic: boolean
  // True once the user signed Router.cancel; with failed, tells a deliberate cancel from an Agent failure.
  cancellationRequested: boolean
  // Unix seconds set by the Agent on UnstakeRequested; null before, immutable after.
  claimableAt?: string | null
  claimTxHash: Hash | null
  // Agent-side failure flag; lingers through CANCELLED/RECOVERED (failed:false recover = deliberate cancel).
  failed: boolean
  // Raw Agent revert reason (bytes) on a remote failure; decoded to pick the recovery CTA.
  failureReason?: string | null
  kind: EarnTransactionKindType
  processedAt?: string | null
  // Unix seconds the Agent received the request (== the failure block on a remote failure).
  receivedAt?: string | null
  receiver: Address
  recoverTxHash: Hash | null
  requestedAt: string
  requestId: string
  requestTxHash: Hash
  // Keeper retries of a remote-failed request; 0 until the first retry.
  retryCount?: number
  settlement?: EarnSettlement
  status: EarnTransactionStatusType
}

export type EarnAsset = {
  address: Address
  token: EvmToken
}

// A pool = one Vetro share vault (Ethereum) plus every Hemi deposit asset that settles into it.
export type EarnPool = {
  // null = settled with no value (show '-'); undefined = still pending.
  apy: number | null | undefined
  assets: EarnAsset[]
  exposureTokens: { address: Address; chainId: EvmToken['chainId'] }[]
  peggedToken: EvmToken
  shareAddress: Address
  shareToken: EvmToken
  // Ethereum ERC-4626 staking vault (assetsData(asset).remoteShare).
  stakingVault: Address
  // StakingVault.totalAssets() in peggedToken units — price via peggedToken, never shareToken (no feed); undefined while loading.
  totalDeposits: bigint | undefined
  totalDepositsStatus: QueryStatus
}

export type EarnPosition = {
  peggedToken: EvmToken
  shareAddress: Address
  shareToken: EvmToken
  // Raw share OFT balance (shareToken.decimals); fiat goes through peggedToken via convertToAssets.
  yourDeposit: bigint
}

// Local mirror of an earn op from this browser; survives route changes and is
// soft-deleted (settled:true) once indexed, but kept so the drawer can still read
// local-only metadata (e.g. approvalTxHash) the indexer never exposes.
type LocalEarnOperationBase = {
  account: Address
  // String because bigint isn't JSON-serializable for localStorage.
  amountIn: string
  approvalTxHash?: Hash
  asset: Address
  chainId: Chain['id']
  initiateTxHash?: Hash
  operator?: Address
  // Manual claim/recover the user signed; survives the soft-settle so the drawer keeps offering Retry.
  settlement?: EarnSettlement
  settled?: boolean
  shareAddress: Address
  // Unix seconds — must match TTL_SECONDS' unit in localEarnOperationsContext (the GC compares them).
  startedAt: number
}

export type LocalEarnDepositOperation = LocalEarnOperationBase & {
  kind: 'DEPOSIT'
  operation: DepositOperation
}

export type LocalEarnWithdrawOperation = LocalEarnOperationBase & {
  kind: 'REDEEM'
  operation: WithdrawOperation
}

export type LocalEarnOperation =
  | LocalEarnDepositOperation
  | LocalEarnWithdrawOperation

export const isLocalEarnDeposit = (
  op: LocalEarnOperation,
): op is LocalEarnDepositOperation => op.kind === 'DEPOSIT'

export const isLocalEarnWithdraw = (
  op: LocalEarnOperation,
): op is LocalEarnWithdrawOperation => op.kind === 'REDEEM'
