'use client'

import { useMemo } from 'react'
import { type Hash } from 'viem'

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
  asset: local.asset,
  automatic: true,
  claimTxHash: null,
  initiatedAt: String(local.startedAt),
  initiateTxHash: local.initiateTxHash as Hash,
  kind: local.kind,
  receiver: local.account,
  recoverTxHash: null,
  requestId: `local-${local.startedAt}`,
  status: localStatus(local.operation),
})

const hashesMatch = (a: Hash | undefined, b: Hash | undefined) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase()

// Public data hook for the transactions table and drawer. Returns the
// subgraph rows merged with not-yet-indexed local entries, sorted by
// initiated-at descending.
//
// Side effects (marking local entries `settled`, invalidating Vetro-side
// balance caches on CLAIMED/RECOVERED transitions) live in the separate
// `useEarnDeliveryWatcher` so they fire exactly once per polling cycle
// instead of N times — once per active consumer of this hook.
export const useEarnTransactions = function () {
  const { data, isError, isLoading } = useEarnTransactionsQuery()
  const { localOperations } = useLocalEarnOperations()

  const merged = useMemo(
    function () {
      const subgraph = (data ?? []).filter(
        t => t.kind === 'DEPOSIT' && t.status !== 'RECOVERED',
      )
      const subgraphHashes = new Set(
        subgraph.map(t => t.initiateTxHash.toLowerCase()),
      )
      const inFlight = localOperations
        .filter(isLocalEarnDeposit)
        // Only show in the table once the user has signed the deposit tx —
        // an approve-only entry isn't a committed deposit (the user can still
        // back out of the wallet prompt). The entry stays in localStorage so
        // the row reappears once `useDeposit` upserts the initiate tx hash.
        .filter(op => op.initiateTxHash !== undefined)
        .filter(op => !subgraphHashes.has(op.initiateTxHash!.toLowerCase()))
        .filter(
          op =>
            // Dedupe against any other local op that may have already been
            // mapped (defensive — shouldn't happen with the upsert).
            !subgraph.some(t =>
              hashesMatch(t.initiateTxHash, op.initiateTxHash),
            ),
        )
        .map(localToEarnTransaction)
      return [...inFlight, ...subgraph].sort(
        (a, b) => Number(b.initiatedAt) - Number(a.initiatedAt),
      )
    },
    [data, localOperations],
  )

  return { data: merged, isError, isPending: isLoading }
}
