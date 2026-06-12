'use client'

import { useQueryClient } from '@tanstack/react-query'
import { hemi } from 'hemi-viem'
import { getTokenBalanceQueryKey } from 'hooks/useBalance'
import { useEffect, useRef } from 'react'
import { type Address, isAddressEqual } from 'viem'
import { useAccount } from 'wagmi'

import { earnPositionsKeyPrefix } from '../_fetchers/fetchEarnPositions'
import {
  type HemiEarnAssetConfig,
  hemiEarnAssetConfigsQueryOptions,
} from '../_fetchers/fetchHemiEarnAssetConfigs'
import {
  type EarnTransaction,
  type EarnTransactionKindType,
  type EarnTransactionStatusType,
  type LocalEarnOperation,
} from '../types'

import { useEarnTransactionsQuery } from './useEarnTransactionsQuery'
import { useLocalEarnOperations } from './useLocalEarnOperations'

const vetroPoolsPrefix = ['hemi-earn', 'pools'] as const
const vetroUserShareValuePrefix = ['hemi-earn', 'user-share-value'] as const

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
  status !== 'FINALIZED' &&
  status !== 'CANCELLED' &&
  status !== 'RECOVERED' &&
  status !== 'FAILED'

type DeliveredStatus = 'FINALIZED' | 'RECOVERED'

type DeliveredEvent = {
  asset: Address
  kind: EarnTransactionKindType
  receiver: Address
  status: DeliveredStatus
}

// Walks the subgraph rows and reports every request that transitioned from
// an in-flight state into a terminal delivery state (FINALIZED / RECOVERED)
// since the previous poll. Returns the delivered events with enough metadata
// (kind, asset, receiver) for the caller to build the exact cache keys
// that actually moved — deposits make the share OFT land on the user's
// Hemi wallet, redeems make the underlying land on the user's Hemi wallet.
// First-time observations of already-terminal hashes (page reload after
// FINALIZED) do NOT count — those rows are historical and don't move
// balances.
function detectCrossChainDeliveries(
  previous: Map<string, EarnTransactionStatusType>,
  rows: EarnTransaction[],
) {
  const events: DeliveredEvent[] = []
  for (const row of rows) {
    if (row.status !== 'FINALIZED' && row.status !== 'RECOVERED') continue
    const prev = previous.get(row.requestTxHash.toLowerCase())
    if (prev === undefined || !isInFlightStatus(prev)) continue
    events.push({
      asset: row.asset,
      kind: row.kind,
      receiver: row.receiver,
      status: row.status,
    })
  }
  return events
}

const findShareForAsset = (configs: HemiEarnAssetConfig[], asset: Address) =>
  configs.find(config => isAddressEqual(config.asset, asset))?.share

// Maps a terminal event to the token whose balance actually moved:
//   DEPOSIT + FINALIZED → share OFT lands on the user's Hemi wallet
//   DEPOSIT + RECOVERED → the deposited asset is refunded
//   REDEEM  + FINALIZED → the underlying asset is delivered
//   REDEEM  + RECOVERED → shares are returned to the user
// RECOVERED inverts the delivery vs FINALIZED in both directions, so we
// need (kind, status) to pick the right cache key.
const movesShareBalance = (event: DeliveredEvent) =>
  (event.kind === 'DEPOSIT' && event.status === 'FINALIZED') ||
  (event.kind === 'REDEEM' && event.status === 'RECOVERED')

const tokenAddressForEvent = (
  configs: HemiEarnAssetConfig[],
  event: DeliveredEvent,
) =>
  movesShareBalance(event)
    ? findShareForAsset(configs, event.asset)
    : event.asset

function invalidateOnDelivery(
  queryClient: ReturnType<typeof useQueryClient>,
  events: DeliveredEvent[],
) {
  queryClient.invalidateQueries({ queryKey: vetroPoolsPrefix })
  queryClient.invalidateQueries({ queryKey: vetroUserShareValuePrefix })
  // Synchronous read of the already-loaded on-chain asset config list (the
  // earn pages fetch it via `useHemiEarnShares`). If it isn't cached yet the
  // share-balance key is skipped; the pools/positions invalidation below
  // still runs.
  const configs =
    queryClient.getQueryData(hemiEarnAssetConfigsQueryOptions().queryKey) ?? []
  for (const event of events) {
    const tokenAddress = tokenAddressForEvent(configs, event)
    if (tokenAddress === undefined) continue
    queryClient.invalidateQueries({
      queryKey: getTokenBalanceQueryKey({
        account: event.receiver,
        chainId: hemi.id,
        tokenAddress,
      }),
    })
  }
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
        data.map(t => [t.requestTxHash.toLowerCase(), t.status]),
      )
      const deliveries = detectCrossChainDeliveries(
        previousSubgraphStatusRef.current,
        data,
      )
      previousSubgraphStatusRef.current = subgraphHashToStatus
      reconcileLocals({
        localOperations,
        markSettledByInitiateTxHash,
        subgraphHashes: new Set(subgraphHashToStatus.keys()),
      })
      if (deliveries.length > 0) {
        invalidateOnDelivery(queryClient, deliveries)
      }
    },
    [address, data, localOperations, markSettledByInitiateTxHash, queryClient],
  )
}
