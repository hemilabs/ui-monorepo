import { CrossChainMessenger } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { hemi } from 'app/networks'
import { useConnectedChainCrossChainMessenger } from 'hooks/useL2Bridge'
import { usePathname } from 'next/navigation'
import pAll from 'p-all'
import pMemoize from 'promise-mem'
import { useCallback, useMemo } from 'react'
import { useSyncInBlockChunks } from 'ui-common/hooks/useSyncInBlockChunks'
import { type Address, type Chain } from 'viem'
import { sepolia } from 'viem/chains'
import { useAccount, useBlockNumber } from 'wagmi'

import { addTimestampToOperation } from './operations'
import { TunnelOperation, RawTunnelOperation } from './types'

const chainConfiguration = {
  [hemi.id]: {
    blockWindowSize: 3500, // Approximately 1/2 day
  },
  [sepolia.id]: {
    blockWindowSize: 3500, // Approximately 1/2 day
    minBlockToSync: 5_294_649, // Approximately hemi testnet birth.
  },
}

// When requesting data per deposit/withdraw, do not request more than 5 per type at a time.
const concurrency = 3

const removeDuplicates = <T extends TunnelOperation>(operations: T[]) =>
  Array.from(
    new Set(operations.map(({ transactionHash }) => transactionHash)),
  ).map(transactionHash =>
    operations.find(operation => operation.transactionHash === transactionHash),
  )

const mergeContent = function <T extends TunnelOperation>(
  previousContent: T[],
  newContent: T[],
) {
  const merged = previousContent.concat(newContent)
  return removeDuplicates<T>(merged).sort((a, b) => b.timestamp - a.timestamp)
}

export const useSyncTunnelOperations = function <T extends TunnelOperation>({
  chainId,
  getStorageKey,
  getTunnelOperations,
  l1ChainId,
}: {
  chainId: Chain['id']

  getStorageKey: (c: Chain['id'], address: Address) => string
  getTunnelOperations: (params: {
    address: Address
    crossChainMessenger: CrossChainMessenger
    fromBlock: number
    toBlock: number
  }) => Promise<RawTunnelOperation<T>[]>
  l1ChainId: Chain['id']
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

  const storageKey = address ? getStorageKey(chainId, address) : undefined

  const queryClient = useQueryClient()

  const { crossChainMessenger, crossChainMessengerStatus } =
    useConnectedChainCrossChainMessenger(l1ChainId)

  // using "useCallback" here gives a warning due to pMemoize.
  // See https://stackoverflow.com/a/72637424/1437934
  const syncBlockWindow = useMemo(
    () =>
      pMemoize(
        (fromBlock: number, toBlock: number) =>
          getTunnelOperations({
            address,
            crossChainMessenger,
            fromBlock,
            toBlock,
          }).then(operations =>
            pAll(
              operations.map(
                operation => () =>
                  addTimestampToOperation<T>(operation, chainId),
              ),
              { concurrency },
            ),
          ),
        {
          resolver: (fromBlock, toBlock) =>
            `${chainId}-${fromBlock}-${toBlock}`,
        },
      ),
    [address, chainId, crossChainMessenger, getTunnelOperations],
  )

  const state = useSyncInBlockChunks<T>({
    ...chainConfiguration[chainId],
    chainId,
    enabled:
      !!storageKey &&
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
    (operation: T) =>
      state.setSyncBlock(function (prev) {
        const newItems = mergeContent<T>(prev.content, [operation])
        return {
          ...prev,
          content: newItems,
        }
      }),

    [state],
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
      updateOperation: state.setSyncBlock,
    }),
    [addOperationToTunnelHistory, state, queryClient, queryKey],
  )
}
