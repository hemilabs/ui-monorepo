import { CrossChainMessenger } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { hemi } from 'app/networks'
import { useConnectedChainCrossChainMessenger } from 'hooks/useL2Bridge'
import { usePathname } from 'next/navigation'
import pAll from 'p-all'
import { useCallback, useMemo } from 'react'
import {
  type SyncState,
  useSyncInBlockChunks,
} from 'ui-common/hooks/useSyncInBlockChunks'
import { type Address, type Chain } from 'viem'
import { sepolia } from 'viem/chains'
import { useAccount, useBlockNumber } from 'wagmi'

import { addTimestampToOperation } from './operations'
import { TunnelOperation } from './types'

const chainConfiguration = {
  [hemi.id]: {
    blockWindowSize: 7000, // Approximately 1 day
  },
  [sepolia.id]: {
    blockWindowSize: 7000, // Approximately 1 day
    minBlockToSync: 5_294_649, // Approximately hemi testnet birth.
  },
}

// When requesting data per deposit/withdraw, do not request more than 5 per type at a time.
const concurrency = 5

const removeDuplicates = (operations: TunnelOperation[]) =>
  Array.from(
    new Set(operations.map(({ transactionHash }) => transactionHash)),
  ).map(transactionHash =>
    operations.find(operation => operation.transactionHash === transactionHash),
  )

const mergeContent = function (
  previousContent: TunnelOperation[],
  newContent: TunnelOperation[],
) {
  const merged = previousContent.concat(newContent)
  return removeDuplicates(merged).sort((a, b) => b.timestamp - a.timestamp)
}

export const useSyncTunnelOperations = function <T extends TunnelOperation>({
  chainId,
  l1ChainId,
  getStorageKey,
  getTunnelOperations,
}: {
  chainId: Chain['id']
  l1ChainId: Chain['id']
  getStorageKey: (c: Chain['id'], address: Address) => string
  getTunnelOperations: (params: {
    address: Address
    crossChainMessenger: CrossChainMessenger
    fromBlock: number
    toBlock: number
  }) => Promise<Omit<T, 'timestamp'>[]>
}) {
  const { address } = useAccount()

  const isTransactionHistoryPage = usePathname().endsWith(
    'transaction-history/',
  )

  const { data: lastBlockNumber, queryKey } = useBlockNumber({
    chainId,
    query: {
      refetchOnMount: 'always',
    },
  })

  const storageKey = getStorageKey(chainId, address)

  const queryClient = useQueryClient()

  const { crossChainMessenger, crossChainMessengerStatus } =
    useConnectedChainCrossChainMessenger(l1ChainId)

  const syncBlockWindow = useCallback(
    (fromBlock: number, toBlock: number) =>
      getTunnelOperations({
        address,
        crossChainMessenger,
        fromBlock,
        toBlock,
      }).then(operations =>
        pAll(
          operations.map(
            operation => () => addTimestampToOperation(operation, chainId),
          ),
          { concurrency },
        ),
      ),
    [address, chainId, crossChainMessenger, getTunnelOperations],
  )

  const state = useSyncInBlockChunks<TunnelOperation>({
    ...chainConfiguration[chainId],
    chainId,
    enabled:
      crossChainMessengerStatus === 'success' &&
      // only sync while in the Transaction History page
      isTransactionHistoryPage,
    lastBlockNumber:
      lastBlockNumber !== undefined ? Number(lastBlockNumber) : undefined,
    mergeContent,
    storageKey,
    syncBlockWindow,
  })

  // Use this function to add an operation to the local storage
  // from outside of the automatic sync process.
  const addOperationToTunnelHistory = useCallback(
    async function (operation: Omit<TunnelOperation, 'timestamp'>) {
      if (state.syncBlock.hasSyncToMinBlock) {
        // This means that we have walked through the whole blockchain history
        // up to minBlockToSync. So we don't need to manually add it
        // as syncing will automatically pick it up.
        return undefined
      }

      // Here our app it is walking through the history way back, so new operations
      // may take a while to appear, because it is still syncing previous blocks
      // and won't check for recent blocks until finishes that process
      // This will cause that recent operations don't appear in the tx history, which
      // is bad for the user experience.
      // So we can manually add them to local storage, without changing the rest
      // if in the future it re-syncs and gets duplicated, the code in "mergeContent"
      // will automatically discard it.

      const stringItem = localStorage.getItem(storageKey)
      if (!stringItem) {
        // if nothing is saved, it means that we have never entered the tx history page before
        // so once we enter it will automatically sync and pick up the new operation.
        // starting from the newest block and going back
        // Nothing to do here then.
        return undefined
      }
      const item: SyncState<TunnelOperation> = JSON.parse(stringItem)
      // add the new operation, and update local storage.
      // It should resync automatically on the state once we enter the tx-history page
      return addTimestampToOperation(operation, chainId).then(
        function (updatedOperation) {
          item.content = mergeContent(item.content, [updatedOperation])
          localStorage.setItem(storageKey, JSON.stringify(item))
        },
      )
    },
    [chainId, state, storageKey],
  )

  return useMemo(
    () => ({
      addOperationToTunnelHistory,
      operations: state.syncBlock.content,
      resumeSync() {
        queryClient.invalidateQueries({ queryKey })
        state.resumeSync()
      },
      syncStatus: state.syncStatus,
    }),
    [addOperationToTunnelHistory, state, queryClient, queryKey],
  )
}
