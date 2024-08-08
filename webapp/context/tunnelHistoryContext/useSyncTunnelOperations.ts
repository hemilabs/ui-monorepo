import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RemoteChain } from 'app/networks'
import { usePathname } from 'next/navigation'
import pAll from 'p-all'
import pMemoize from 'promise-mem'
import { useCallback, useMemo } from 'react'
import { useSyncInBlockChunks } from 'ui-common/hooks/useSyncInBlockChunks'
import { chainConfiguration } from 'utils/sync-history/chainConfiguration'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'

import { addTimestampToOperation } from './operations'
import { TunnelOperation, RawTunnelOperation } from './types'

// When requesting data per deposit/withdraw, do not request more than 5 per type at a time.
const concurrency = 3

const removeDuplicates = <T extends TunnelOperation>(operations: T[]) =>
  Array.from(
    new Set(operations.map(({ transactionHash }) => transactionHash)),
  ).map(transactionHash =>
    operations.find(operation => operation.transactionHash === transactionHash),
  )

const mergeContentByChainId = (chainId: RemoteChain['id']) =>
  function <T extends TunnelOperation>(previousContent: T[], newContent: T[]) {
    const merged = previousContent.concat(newContent)
    return (
      removeDuplicates<T>(merged)
        .sort((a, b) => b.timestamp - a.timestamp)
        // Adding this because our first testing users, before chainId was added due to bitcoin
        // this field wasn't saved. So when syncing, it will add it to all existing operations.
        // Eventually, probably once we launch, we can remove this, because we're now adding chainId
        // after every deposit/withdrawal per chain in the correct places.
        // See https://github.com/BVM-priv/ui-monorepo/issues/376
        .map(c => ({
          ...c,
          chainId,
        }))
    )
  }

type SyncTunnelOperationArgs<T extends TunnelOperation> = {
  chainId: RemoteChain['id']
  enabled: boolean
  getBlockNumber: () => Promise<number>
  getStorageKey: (c: RemoteChain['id'], address: Address) => string
  getTunnelOperations: (params: {
    address: Address
    fromBlock: number
    toBlock: number
  }) => Promise<RawTunnelOperation<T>[]>
  operationChainId: RemoteChain['id']
}

export const useSyncTunnelOperations = function <T extends TunnelOperation>({
  chainId,
  enabled,
  getBlockNumber,
  getStorageKey,
  getTunnelOperations,
  operationChainId,
}: SyncTunnelOperationArgs<T>) {
  const { address } = useAccount()

  const isTransactionHistoryPage = usePathname().endsWith(
    'transaction-history/',
  )

  const blockNumberQueryKey = useMemo(
    () => ['tunnel-history-block-number', chainId],
    [chainId],
  )

  const { data: lastBlockNumber } = useQuery({
    queryFn: getBlockNumber,
    queryKey: blockNumberQueryKey,
    refetchOnMount: 'always',
  })

  const storageKey = address ? getStorageKey(chainId, address) : undefined

  const queryClient = useQueryClient()

  // using "useCallback" here gives a warning due to pMemoize.
  // See https://stackoverflow.com/a/72637424/1437934
  const syncBlockWindow = useMemo(
    () =>
      pMemoize(
        (fromBlock: number, toBlock: number) =>
          getTunnelOperations({
            address,
            fromBlock,
            toBlock,
          }).then(operations =>
            pAll(
              operations.map(
                operation => () =>
                  // valid for the time being, because reading past deposits for bitcoin is not enabled.
                  // But this may need to be revisited once that happens (we still don't know how will work).
                  // @ts-expect-error See https://github.com/BVM-priv/ui-monorepo/issues/345
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
    [address, chainId, getTunnelOperations],
  )

  // Remove chain id once enough time has passed that data has auto-corrected for users
  // See https://github.com/BVM-priv/ui-monorepo/issues/376 and
  // https://github.com/BVM-priv/ui-monorepo/issues/431
  const mergeContent = useMemo(
    () => mergeContentByChainId(operationChainId),
    [operationChainId],
  )

  const state = useSyncInBlockChunks<T>({
    ...chainConfiguration[chainId],
    enabled:
      enabled &&
      !!storageKey &&
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

    [mergeContent, state],
  )

  return useMemo(
    () => ({
      addOperationToTunnelHistory,
      operations: state.syncBlock.content,
      resumeSync() {
        queryClient.invalidateQueries({ queryKey: blockNumberQueryKey })
        state.resumeSync()
      },
      syncStatus: state.syncStatus,
      updateOperation: state.setSyncBlock,
    }),
    [addOperationToTunnelHistory, blockNumberQueryKey, queryClient, state],
  )
}
