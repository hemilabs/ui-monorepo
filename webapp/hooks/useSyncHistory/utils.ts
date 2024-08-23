import { type RemoteChain } from 'app/networks'
import { type TunnelOperation } from 'types/tunnel'
import { type Address, type Chain } from 'viem'

import {
  type HistoryReducerState,
  type StorageChain,
  type SyncContentPayload,
  type SyncStatus,
  type SyncType,
} from './types'

export const getTunnelHistoryDepositFallbackStorageKey = (
  l1ChainId: RemoteChain['id'],
  address: Address,
) => `portal.transaction-history-L1-${l1ChainId}-${address}-deposits`

export const getTunnelHistoryDepositStorageKey = (
  l1ChainId: RemoteChain['id'],
  l2ChainId: Chain['id'],
  address: Address,
) => `portal.transaction-history-${l1ChainId}-${l2ChainId}-${address}-deposits`

export const getTunnelHistoryWithdrawStorageKey = (
  l1ChainId: RemoteChain['id'],
  l2ChainId: Chain['id'],
  address: Address,
) =>
  `portal.transaction-history-${l1ChainId}-${l2ChainId}-${address}-withdrawals`

export const getTunnelHistoryWithdrawStorageKeyFallback = (
  l2ChainId: Chain['id'],
  address: Address,
) => `portal.transaction-history-L2-${l2ChainId}-${address}-withdrawals`

const removeDuplicates = <T extends TunnelOperation>(merged: T[]) =>
  Array.from(new Set(merged.map(({ transactionHash }) => transactionHash))).map(
    transactionHash =>
      merged.find(operation => operation.transactionHash === transactionHash),
  )

const mergeContent = <T extends TunnelOperation>(
  oldContent: T[],
  newContent: T[],
) =>
  removeDuplicates(oldContent.concat(newContent)).sort(
    (a, b) => b.timestamp - a.timestamp,
  )

export const syncContent = <
  TOperation extends TunnelOperation,
  TSyncType extends SyncType,
>(
  { content, ...stored }: StorageChain<TOperation>,
  {
    content: newContent,
    ...payload
  }: SyncContentPayload<TOperation, TSyncType>,
) => ({
  content: mergeContent(content, newContent),
  ...stored,
  ...payload,
})

export const addOperation = <T extends TunnelOperation>(
  operations: StorageChain<T>[],
  newItem: T,
) =>
  operations.map(function (chainOperations) {
    if (chainOperations.chainId !== newItem.l1ChainId) {
      return chainOperations
    }
    return {
      ...chainOperations,
      content: mergeContent(chainOperations.content, [newItem]),
    }
  })

export const updateChainSyncStatus = (
  state: HistoryReducerState,
  chainId: RemoteChain['id'],
  newStatus: StorageChain['status'],
) => ({
  ...state,
  deposits: state.deposits.map(chainDeposits =>
    chainDeposits.chainId === chainId
      ? {
          ...chainDeposits,
          status: newStatus,
        }
      : chainDeposits,
  ),
  withdrawals: state.withdrawals.map(chainWithdrawals =>
    chainWithdrawals.chainId === chainId
      ? {
          ...chainWithdrawals,
          status: newStatus,
        }
      : chainWithdrawals,
  ),
})

export const updateOperation = <T extends TunnelOperation>(
  operations: StorageChain<T>[],
  { operation, updates }: { operation: T; updates: Partial<T> },
) =>
  operations.map(function (chainOperations) {
    if (chainOperations.chainId !== operation.l1ChainId) {
      return chainOperations
    }
    return {
      ...chainOperations,
      content: chainOperations.content.map(d =>
        d.transactionHash === operation.transactionHash
          ? ({ ...d, ...updates } as T)
          : d,
      ),
    }
  })

const isChainFinishedSyncing = (chain: StorageChain) =>
  chain.status === 'finished'
const isChainReady = (chain: StorageChain) => chain.status === 'ready'
const isChainSyncing = (chain: StorageChain) => chain.status === 'syncing'

export const getSyncStatus = function (
  state: Omit<HistoryReducerState, 'status'>,
): SyncStatus {
  if (
    state.deposits.some(isChainSyncing) ||
    state.withdrawals.some(isChainSyncing)
  ) {
    return 'syncing'
  }

  const hasLoaded = state.deposits.length > 0 || state.withdrawals.length > 0

  if (!hasLoaded) {
    return 'idle'
  }

  if (
    state.deposits.every(isChainFinishedSyncing) &&
    state.withdrawals.every(isChainFinishedSyncing)
  ) {
    return 'finished'
  }

  if (
    state.deposits.every(isChainReady) &&
    state.withdrawals.every(isChainReady)
  ) {
    return 'ready'
  }

  return 'idle'
}
