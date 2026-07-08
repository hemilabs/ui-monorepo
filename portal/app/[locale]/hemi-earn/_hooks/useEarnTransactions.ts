'use client'

import { useMemo } from 'react'
import { type Hash } from 'viem'

import { hashesMatch, isEarnRowTerminal } from '../_utils'
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

// Record (not a function) so a new DepositStatus becomes a compile error. TX_PENDING =
// before the tx mines; PENDING = mined but not yet indexed (= subgraph PENDING).
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

// Local entry → table row. Callers must filter out approve-only entries (no initiateTxHash) first — the cast trusts that.
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

// Merges subgraph rows with not-yet-indexed local entries (sorted desc). Side effects
// live in useEarnDeliveryWatcher so they fire once per poll, not once per consumer.
export const useEarnTransactions = function () {
  const { data, isError, isLoading } = useEarnTransactionsQuery()
  const { localOperations } = useLocalEarnOperations()

  const merged = useMemo(
    function () {
      const localDeposits = localOperations.filter(isLocalEarnDeposit)
      const localWithdraws = localOperations.filter(isLocalEarnWithdraw)
      // Local metadata keyed by request hash; survives soft-settle to enrich subgraph rows with indexer-missing bits (approvalTxHash).
      const localByRequestHash = new Map(
        [...localDeposits, ...localWithdraws]
          .filter(op => op.initiateTxHash !== undefined)
          .map(op => [op.initiateTxHash!.toLowerCase(), op]),
      )
      const subgraph = (data ?? []).map(function (t) {
        const local = localByRequestHash.get(t.requestTxHash.toLowerCase())
        if (!local) return t
        // Terminal Router status wins over a lingering local settlement — a
        // FINALIZED/RECOVERED row must never re-expose the CTA or a Tx Failed overlay.
        const isTerminal = isEarnRowTerminal(t)
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
        // Show only once the request tx is signed — an approve-only entry isn't committed yet (the entry stays for when it is).
        .filter(op => op.initiateTxHash !== undefined)
        // Skip soft-settled entries; the subgraph row supersedes them (kept above only to enrich).
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
