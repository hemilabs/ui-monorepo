'use client'

import { useMemo } from 'react'
import { type Hash } from 'viem'

import { hashesMatch } from '../_utils'
import {
  DepositStatus,
  type DepositOperation,
  type DepositStatusType,
} from '../pool/[shareAddress]/_types/operations'
import {
  type EarnTransaction,
  type EarnTransactionStatusType,
  type LocalEarnDepositOperation,
  isLocalEarnDeposit,
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

const localStatus = (operation: DepositOperation): EarnTransactionStatusType =>
  localStatusByDepositStatus[operation.status]

// Convert a not-yet-indexed local deposit into a row the table can render.
// Callers must filter out approve-only entries (no `initiateTxHash` yet)
// before passing to this function — the cast below trusts that.
const localToEarnTransaction = (
  local: LocalEarnDepositOperation,
): EarnTransaction => ({
  amountIn: local.amountIn,
  amountOut: null,
  approvalTxHash: local.approvalTxHash,
  asset: local.asset,
  automatic: true,
  claimTxHash: null,
  kind: local.kind,
  receiver: local.account,
  recoverTxHash: null,
  requestedAt: String(local.startedAt),
  requestId: `local-${local.startedAt}`,
  requestTxHash: local.initiateTxHash as Hash,
  status: localStatus(local.operation),
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
      // Locally-captured metadata keyed by initiate tx hash. Survives the
      // soft-settle flag because the entry stays in storage — that's the
      // whole point of soft-delete: enrich subgraph rows with bits the
      // indexer doesn't expose (`approvalTxHash`).
      const localByInitiateHash = new Map(
        localDeposits
          .filter(op => op.initiateTxHash !== undefined)
          .map(op => [op.initiateTxHash!.toLowerCase(), op]),
      )
      const subgraph = (data ?? [])
        .filter(t => t.kind === 'DEPOSIT' && t.status !== 'RECOVERED')
        .map(function (t) {
          const local = localByInitiateHash.get(t.requestTxHash.toLowerCase())
          if (!local?.approvalTxHash) return t
          return { ...t, approvalTxHash: local.approvalTxHash }
        })
      const subgraphHashes = new Set(
        subgraph.map(t => t.requestTxHash.toLowerCase()),
      )
      const inFlight = localDeposits
        // Only show in the table once the user has signed the deposit tx —
        // an approve-only entry isn't a committed deposit (the user can still
        // back out of the wallet prompt). The entry stays in localStorage so
        // the row reappears once `useDeposit` upserts the initiate tx hash.
        .filter(op => op.initiateTxHash !== undefined)
        // Skip soft-settled entries — the subgraph row supersedes them in
        // the table (we still kept the entry around above to enrich the
        // subgraph row with `approvalTxHash`).
        .filter(op => !op.settled)
        .filter(op => !subgraphHashes.has(op.initiateTxHash!.toLowerCase()))
        .filter(
          op =>
            // Dedupe against any other local op that may have already been
            // mapped (defensive — shouldn't happen with the upsert).
            !subgraph.some(t =>
              hashesMatch(t.requestTxHash, op.initiateTxHash),
            ),
        )
        .map(localToEarnTransaction)
      return [...inFlight, ...subgraph].sort(
        (a, b) => Number(b.requestedAt) - Number(a.requestedAt),
      )
    },
    [data, localOperations],
  )

  return { data: merged, isError, isPending: isLoading }
}
