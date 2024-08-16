import { type RemoteChain } from 'app/networks'
import { type TunnelOperation } from 'types/tunnel'
import { type Address, type Chain } from 'viem'

import { type StorageChain, type SyncContentPayload } from './types'

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

export const syncContent = function <T extends TunnelOperation>(
  { chainId, content }: StorageChain<T>,
  payload: SyncContentPayload<T>,
) {
  return {
    chainId,
    content: mergeContent(content, payload.content),
    ...payload,
  }
}

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
