'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'

import { earnPositionsKeyPrefix } from '../_fetchers/fetchEarnPositions'
import {
  type EarnTransactionStatusType,
  type LocalEarnOperation,
} from '../types'

import { useEarnTransactionsQuery } from './useEarnTransactionsQuery'
import { useLocalEarnOperations } from './useLocalEarnOperations'

const vetroPoolsPrefix = ['hemi-earn', 'pools'] as const
const vetroUserPoolBalancePrefix = ['hemi-earn', 'user-pool-balance'] as const

type ReconcileArgs = {
  localOperations: LocalEarnOperation[]
  markSettledByInitiateTxHash: ReturnType<
    typeof useLocalEarnOperations
  >['markSettledByInitiateTxHash']
  subgraphHashes: Set<string>
}

// Soft-settles any local entry whose `initiateTxHash` has appeared in the
// subgraph — the subgraph row supersedes the local mirror in the merged
// table, but the local entry stays in storage so drawers can still read
// locally-captured metadata (e.g. `approvalTxHash`) that the indexer
// doesn't expose. Idempotent: re-flagging an already-settled entry is a
// no-op.
function reconcileLocals({
  localOperations,
  markSettledByInitiateTxHash,
  subgraphHashes,
}: ReconcileArgs) {
  for (const local of localOperations) {
    if (!local.initiateTxHash) continue
    if (local.settled) continue
    if (!subgraphHashes.has(local.initiateTxHash.toLowerCase())) continue
    markSettledByInitiateTxHash(local.initiateTxHash)
  }
}

const isInFlightStatus = (status: EarnTransactionStatusType) =>
  status !== 'CLAIMED' && status !== 'CANCELLED' && status !== 'RECOVERED'

// Walks the previous-vs-current subgraph status maps and reports whether any
// deposit hash transitioned from an in-flight state into a terminal delivery
// state (CLAIMED / RECOVERED) since the last poll. First-time observations
// of already-terminal hashes (page reload after CLAIMED) do NOT count —
// those rows are historical and don't move balances.
function detectCrossChainDelivery(
  previous: Map<string, EarnTransactionStatusType>,
  current: Map<string, EarnTransactionStatusType>,
) {
  for (const [hash, status] of current) {
    if (status !== 'CLAIMED' && status !== 'RECOVERED') continue
    const prev = previous.get(hash)
    if (prev !== undefined && isInFlightStatus(prev)) return true
  }
  return false
}

function invalidateVetroBalances(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: vetroPoolsPrefix })
  queryClient.invalidateQueries({ queryKey: vetroUserPoolBalancePrefix })
  // `resetQueries` is the only single-call primitive that does both halves
  // of what we need: it removes every matching cache entry (so the inner
  // `ensureQueryData` reads inside `fetchEarnPositions` go to the network
  // instead of returning stale data) AND it triggers a refetch on the
  // active observer (`useEarnPositions`, which stays mounted on the home
  // page while the user waits for the deposit to settle). The intuitive
  // pair `removeQueries` + `invalidateQueries` does not work in v5 — the
  // first call evicts the cache entry, leaving `invalidateQueries` with
  // nothing to match.
  queryClient.resetQueries({ queryKey: earnPositionsKeyPrefix })
}

// Mount this exactly once per route group (today, inside the layout-level
// `<EarnStatusUpdaters>`). Mounting from multiple consumers would multiply
// the side-effect work without changing behavior — react-query dedupes the
// underlying fetch, but every observer runs its own useEffect.
export const useEarnDeliveryWatcher = function () {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const { localOperations, markSettledByInitiateTxHash } =
    useLocalEarnOperations()
  const { data } = useEarnTransactionsQuery()

  const previousSubgraphStatusRef = useRef<
    Map<string, EarnTransactionStatusType>
  >(new Map())

  // The previous-status snapshot is account-scoped — wipe it on wallet
  // change so account A's hashes don't leak into account B's transition
  // detection.
  useEffect(
    function resetSnapshotOnAccountChange() {
      previousSubgraphStatusRef.current = new Map()
    },
    [address],
  )

  useEffect(
    function reconcileAndInvalidate() {
      if (!data || data.length === 0 || !address) return
      const subgraphHashToStatus = new Map<string, EarnTransactionStatusType>(
        data
          .filter(t => t.kind === 'DEPOSIT')
          .map(t => [t.initiateTxHash.toLowerCase(), t.status]),
      )
      const crossChainDelivered = detectCrossChainDelivery(
        previousSubgraphStatusRef.current,
        subgraphHashToStatus,
      )
      previousSubgraphStatusRef.current = subgraphHashToStatus
      reconcileLocals({
        localOperations,
        markSettledByInitiateTxHash,
        subgraphHashes: new Set(subgraphHashToStatus.keys()),
      })
      if (crossChainDelivered) {
        invalidateVetroBalances(queryClient)
      }
    },
    [address, data, localOperations, markSettledByInitiateTxHash, queryClient],
  )
}
