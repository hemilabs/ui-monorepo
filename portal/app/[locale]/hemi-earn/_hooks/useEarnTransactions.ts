'use client'

import { useMemo } from 'react'
import { type Hash } from 'viem'

import { hashesMatch } from '../_utils'
import {
  DepositStatus,
  WithdrawStatus,
  type DepositOperation,
  type DepositStatusType,
  type WithdrawOperation,
  type WithdrawStatusType,
} from '../pool/[shareAddress]/_types/operations'
import {
  type EarnTransaction,
  type EarnTransactionStatusType,
  type LocalEarnDepositOperation,
  type LocalEarnWithdrawOperation,
  isLocalEarnDeposit,
  isLocalEarnWithdraw,
} from '../types'

import { useEarnTransactionsQuery } from './useEarnTransactionsQuery'
import { useLocalEarnOperations } from './useLocalEarnOperations'

// Maps the granular local `DepositStatus` enum to the table-level
// `EarnTransactionStatusType`. Declared as a `Record` so any new
// `DepositStatus` member added later becomes a compile error instead of
// silently falling through to "in progress".
//
// `TX_PENDING` covers everything before the request-deposit tx is mined.
// `PENDING` covers the post-mine window before the subgraph indexes the
// row — semantically equivalent to subgraph `PENDING` (on-chain piece
// done, cross-chain in flight).
const localStatusByDepositStatus: Record<
  DepositStatusType,
  EarnTransactionStatusType
> = {
  [DepositStatus.APPROVAL_TX_PENDING]: 'TX_PENDING',
  [DepositStatus.APPROVAL_TX_FAILED]: 'FAILED',
  [DepositStatus.APPROVAL_TX_COMPLETED]: 'TX_PENDING',
  [DepositStatus.DEPOSIT_TX_PENDING]: 'TX_PENDING',
  [DepositStatus.DEPOSIT_TX_FAILED]: 'FAILED',
  [DepositStatus.DEPOSIT_TX_CONFIRMED]: 'PENDING',
}

const localDepositStatus = (
  operation: DepositOperation,
): EarnTransactionStatusType => localStatusByDepositStatus[operation.status]

const localStatusByWithdrawStatus: Record<
  WithdrawStatusType,
  EarnTransactionStatusType
> = {
  [WithdrawStatus.APPROVAL_TX_PENDING]: 'TX_PENDING',
  [WithdrawStatus.APPROVAL_TX_FAILED]: 'FAILED',
  [WithdrawStatus.APPROVAL_TX_COMPLETED]: 'TX_PENDING',
  [WithdrawStatus.WITHDRAW_TX_PENDING]: 'TX_PENDING',
  [WithdrawStatus.WITHDRAW_TX_FAILED]: 'FAILED',
  [WithdrawStatus.WITHDRAW_TX_CONFIRMED]: 'PENDING',
}

const localWithdrawStatus = (
  operation: WithdrawOperation,
): EarnTransactionStatusType => localStatusByWithdrawStatus[operation.status]

// Convert a not-yet-indexed local entry into a row the table can render.
// Callers must filter out approve-only entries (no `initiateTxHash` yet)
// before passing to these — the casts trust that.
const localToEarnDepositTransaction = (
  local: LocalEarnDepositOperation,
): EarnTransaction => ({
  amountIn: local.amountIn,
  amountOut: null,
  approvalTxHash: local.approvalTxHash,
  asset: local.asset,
  automatic: true,
  cancellationRequested: false,
  claimTxHash: null,
  failed: false,
  kind: local.kind,
  receiver: local.account,
  recoverTxHash: null,
  requestedAt: String(local.startedAt),
  requestId: `local-${local.startedAt}`,
  requestTxHash: local.initiateTxHash as Hash,
  status: localDepositStatus(local.operation),
})

const localToEarnWithdrawTransaction = (
  local: LocalEarnWithdrawOperation,
): EarnTransaction => ({
  amountIn: local.amountIn,
  amountOut: null,
  approvalTxHash: local.approvalTxHash,
  asset: local.asset,
  automatic: true,
  cancellationRequested: false,
  claimTxHash: null,
  failed: false,
  kind: local.kind,
  receiver: local.account,
  recoverTxHash: null,
  requestedAt: String(local.startedAt),
  requestId: `local-${local.startedAt}`,
  requestTxHash: local.initiateTxHash as Hash,
  status: localWithdrawStatus(local.operation),
})

// Public data hook for the transactions table and drawer. Returns the
// subgraph rows merged with not-yet-indexed local entries, sorted by
// requested-at descending.
//
// Side effects (removing local entries once the subgraph indexes them,
// invalidating Vetro-side balance caches on FINALIZED/RECOVERED
// transitions) live in the separate `useEarnDeliveryWatcher` so they fire
// exactly once per polling cycle instead of N times — once per active
// consumer of this hook.
export const useEarnTransactions = function () {
  const { data, isError, isLoading } = useEarnTransactionsQuery()
  const { localOperations } = useLocalEarnOperations()

  const merged = useMemo(
    function () {
      const localDeposits = localOperations.filter(isLocalEarnDeposit)
      const localWithdraws = localOperations.filter(isLocalEarnWithdraw)
      // Locally-captured metadata keyed by request tx hash. Survives the
      // soft-settle flag because the entry stays in storage — that's the
      // whole point of soft-delete: enrich subgraph rows with bits the
      // indexer doesn't expose (`approvalTxHash`).
      const localByRequestHash = new Map(
        [...localDeposits, ...localWithdraws]
          .filter(op => op.initiateTxHash !== undefined)
          .map(op => [op.initiateTxHash!.toLowerCase(), op]),
      )
      const subgraph = (data ?? []).map(function (t) {
        const local = localByRequestHash.get(t.requestTxHash.toLowerCase())
        if (!local) return t
        // The authoritative terminal Router status wins over a lingering
        // local settlement — a pending marker mid-indexing-lag or a stale
        // reverted one. A FINALIZED/RECOVERED row must never re-expose the
        // claim/recover CTA or a "Tx Failed" overlay.
        const isTerminal = t.status === 'FINALIZED' || t.status === 'RECOVERED'
        return {
          ...t,
          ...(local.approvalTxHash
            ? { approvalTxHash: local.approvalTxHash }
            : {}),
          ...(local.settlement && !isTerminal
            ? { settlement: local.settlement }
            : {}),
        }
      })
      const subgraphHashes = new Set(
        subgraph.map(t => t.requestTxHash.toLowerCase()),
      )
      const inFlightDeposits = localDeposits
        // Only show in the table once the user has signed the request tx —
        // an approve-only entry isn't a committed action (the user can still
        // back out of the wallet prompt). The entry stays in localStorage so
        // the row reappears once the request hash is captured.
        .filter(op => op.initiateTxHash !== undefined)
        // Skip soft-settled entries — the subgraph row supersedes them
        // (we still kept the entry above to enrich with `approvalTxHash`).
        .filter(op => !op.settled)
        .filter(op => !subgraphHashes.has(op.initiateTxHash!.toLowerCase()))
        .filter(
          op =>
            !subgraph.some(t =>
              hashesMatch(t.requestTxHash, op.initiateTxHash),
            ),
        )
        .map(localToEarnDepositTransaction)
      const inFlightWithdraws = localWithdraws
        .filter(op => op.initiateTxHash !== undefined)
        .filter(op => !op.settled)
        .filter(op => !subgraphHashes.has(op.initiateTxHash!.toLowerCase()))
        .filter(
          op =>
            !subgraph.some(t =>
              hashesMatch(t.requestTxHash, op.initiateTxHash),
            ),
        )
        .map(localToEarnWithdrawTransaction)
      return [...inFlightDeposits, ...inFlightWithdraws, ...subgraph].sort(
        (a, b) => Number(b.requestedAt) - Number(a.requestedAt),
      )
    },
    [data, localOperations],
  )

  return { data: merged, isError, isPending: isLoading }
}
