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

// Query-key prefixes invalidated when a deposit transitions to a terminal
// Vetro state (CLAIMED / RECOVERED). These are the queries that only change
// once cross-chain delivery completes — invalidating earlier (e.g. inside
// `useDeposit.onSettled`) just re-fetches the pre-deposit state because
// LayerZero hasn't run yet.
const vetroPoolsPrefix = ['hemi-earn', 'pools'] as const
const vetroUserPoolBalancePrefix = ['hemi-earn', 'user-pool-balance'] as const

type ReconcileArgs = {
  localOperations: LocalEarnOperation[]
  reconciledRef: { current: Set<string> }
  subgraphHashToStatus: Map<string, EarnTransactionStatusType>
  upsertLocalOperation: ReturnType<
    typeof useLocalEarnOperations
  >['upsertLocalOperation']
}

// Flips matching local entries to `settled: true` once the subgraph has
// indexed them at all — regardless of subgraph status. Drives table cleanup
// and polling termination. Independent from the invalidation watcher below,
// which fires on the separate subgraph status transition.
function reconcileLocals({
  localOperations,
  reconciledRef,
  subgraphHashToStatus,
  upsertLocalOperation,
}: ReconcileArgs) {
  for (const local of localOperations) {
    if (local.settled || !local.initiateTxHash) continue
    const hash = local.initiateTxHash.toLowerCase()
    if (reconciledRef.current.has(hash)) continue
    if (!subgraphHashToStatus.has(hash)) continue
    reconciledRef.current.add(hash)
    upsertLocalOperation({
      account: local.account,
      kind: local.kind,
      settled: true,
      startedAt: local.startedAt,
    })
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

// Broad-prefix invalidation for the queries that move only after cross-chain
// delivery: vault TVL, user pool position, staked-balance card. Transitions
// are sparse, so re-fetching all matching keys is cheap.
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

// Side-effect hook that drives two jobs off the same polling subscription:
//
// 1. Local reconcile — when the subgraph first indexes a local entry (any
//    status, including PENDING), flip its `settled` flag so the table stops
//    rendering the optimistic row and the polling predicate can eventually
//    wind down. `reconciledRef` keeps this idempotent.
//
// 2. Cross-chain delivery detection — separately, watch the subgraph status
//    itself for an in-flight → CLAIMED/RECOVERED transition. This is the
//    precise moment Vetro-side balances actually move, and it's what triggers
//    the cache invalidation that refreshes the staked-balance card and the
//    pool TVL card.
//
// These cannot share state: in a delayed-CLAIMED flow the subgraph returns
// PENDING first, which marks the local entry settled. By the time CLAIMED
// arrives, the local-driven path has already short-circuited via
// `reconciledRef`. The separate `previousSubgraphStatusRef` sees the
// PENDING → CLAIMED transition and fires the invalidation regardless.
//
// Mount this exactly once per route group (today, inside the layout-level
// `<EarnStatusUpdaters>`). Mounting from multiple consumers would multiply
// the side-effect work without changing behavior — react-query dedupes the
// underlying fetch, but every observer runs its own useEffect.
export const useEarnDeliveryWatcher = function () {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const { localOperations, upsertLocalOperation } = useLocalEarnOperations()
  const { data } = useEarnTransactionsQuery()

  const reconciledRef = useRef<Set<string>>(new Set())
  const previousSubgraphStatusRef = useRef<
    Map<string, EarnTransactionStatusType>
  >(new Map())

  // Refs are session-scoped state, but the data they track is account-scoped.
  // Wipe both when the connected wallet changes so we don't carry account A's
  // reconciled hashes / status snapshot into account B's polling loop — left
  // unchecked this leaks memory across switches and can wedge a retry-after-
  // FAILED entry that shares an `initiateTxHash` with a previously-reconciled
  // one.
  useEffect(
    function resetRefsOnAccountChange() {
      reconciledRef.current = new Set()
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
        reconciledRef,
        subgraphHashToStatus,
        upsertLocalOperation,
      })
      if (crossChainDelivered) {
        invalidateVetroBalances(queryClient)
      }
    },
    [address, data, localOperations, queryClient, upsertLocalOperation],
  )
}
