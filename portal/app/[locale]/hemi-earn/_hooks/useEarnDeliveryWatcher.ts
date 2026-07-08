'use client'

import { useQueryClient } from '@tanstack/react-query'
import { hemi } from 'hemi-viem'
import { getTokenBalanceQueryKey } from 'hooks/useBalance'
import { useEffect, useRef } from 'react'
import { type Address, getAddress, isAddressEqual } from 'viem'
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

// Soft-settle local entries once the subgraph indexes them; the entry stays for drawer metadata. Idempotent.
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

const isPreDeliveryStatus = (status: EarnTransactionStatusType) =>
  status !== 'FINALIZED' && status !== 'RECOVERED'

type DeliveredStatus = 'FINALIZED' | 'RECOVERED'

type DeliveredEvent = {
  asset: Address
  kind: EarnTransactionKindType
  receiver: Address
  status: DeliveredStatus
}

// Requests that transitioned in-flight → terminal (FINALIZED/RECOVERED) since the last
// poll, with the metadata to build the moved cache keys. First-time-terminal rows (page
// reload) are historical and skipped — they don't move balances.
function detectCrossChainDeliveries(
  previous: Map<string, EarnTransactionStatusType>,
  rows: EarnTransaction[],
) {
  const events: DeliveredEvent[] = []
  for (const row of rows) {
    if (row.status !== 'FINALIZED' && row.status !== 'RECOVERED') continue
    const prev = previous.get(row.requestTxHash.toLowerCase())
    if (prev === undefined || !isPreDeliveryStatus(prev)) continue
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

// Which token's balance moved. RECOVERED inverts the delivery vs FINALIZED, so both kind and status are needed.
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
  // Sync read of the already-loaded config list; if not cached, skip the share-balance key (pools/positions still invalidate).
  const configs =
    queryClient.getQueryData(hemiEarnAssetConfigsQueryOptions().queryKey) ?? []
  for (const event of events) {
    const tokenAddress = tokenAddressForEvent(configs, event)
    if (tokenAddress === undefined) continue
    queryClient.invalidateQueries({
      queryKey: getTokenBalanceQueryKey({
        account: event.receiver,
        chainId: hemi.id,
        tokenAddress: getAddress(tokenAddress),
      }),
    })
  }
  // resetQueries both evicts the cache (so fetchEarnPositions' ensureQueryData refetches)
  // and refetches the mounted observer; removeQueries + invalidateQueries doesn't do both in v5.
  queryClient.resetQueries({ queryKey: earnPositionsKeyPrefix })
}

// Mount exactly once per route group; extra mounts duplicate the side-effect work (RQ dedupes the fetch, not the effect).
export const useEarnDeliveryWatcher = function () {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const { localOperations, markSettledByInitiateTxHash } =
    useLocalEarnOperations()
  const { data } = useEarnTransactionsQuery()

  const previousSubgraphStatusRef = useRef<
    Map<string, EarnTransactionStatusType>
  >(new Map())

  // Account-scoped snapshot; wipe on wallet change so A's hashes don't leak into B's transition detection.
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
