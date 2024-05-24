import { useEffect, useState } from 'react'
import { Chain } from 'viem'

export type SyncStatus = 'error' | 'finished' | 'syncing'

type UseSyncInBlockChunks<T> = {
  blockWindowSize: number
  chainId: Chain['id']
  enabled: boolean
  lastBlockNumber: number | undefined
  mergeContent: (previousContent: T[], newContent: T[]) => T[]
  minBlockToSync?: number
  storageKey: string
  syncBlockWindow: (fromBlock: number, toBlock: number) => Promise<T[]>
}

export type SyncState<T> = {
  chunkIndex: number
  content: T[]
  fromBlock: number
  hasSyncToMinBlock: boolean
  toBlock: number | undefined
}

const getPreviousFromBlock = ({
  blockWindowSize,
  chunkIndex,
  minBlock,
  pivotBlock,
}: {
  blockWindowSize: number
  chunkIndex: number
  minBlock: number
  pivotBlock: number
}) => Math.max(minBlock, pivotBlock - blockWindowSize * chunkIndex)

const defaultSyncState = <T>(): SyncState<T> => ({
  chunkIndex: 0,
  content: [],
  fromBlock: 0,
  hasSyncToMinBlock: false,
  toBlock: undefined,
})

export const useSyncInBlockChunks = function <T>({
  blockWindowSize,
  chainId,
  enabled,
  lastBlockNumber,
  mergeContent,
  minBlockToSync = 0,
  storageKey,
  syncBlockWindow,
}: UseSyncInBlockChunks<T>) {
  const [syncBlock, setSyncBlock] = useState<SyncState<T>>({
    ...defaultSyncState<T>(),
    fromBlock: minBlockToSync,
  })

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing')

  useEffect(
    function loadSyncStateOrSetDefault() {
      if (!enabled) {
        return
      }

      const storedItem = localStorage.getItem(storageKey)
      if (!storedItem) {
        setSyncBlock(defaultSyncState<T>())
        return
      }

      const { chunkIndex, content, hasSyncToMinBlock, toBlock }: SyncState<T> =
        JSON.parse(storedItem)

      if (hasSyncToMinBlock) {
        setSyncBlock({
          // the previous value we've synced up to, is now the lower bound to review. The latest blockNumber will be the new toBlock
          chunkIndex: 0,
          content,
          fromBlock: toBlock + 1,
          hasSyncToMinBlock: false,
          toBlock: undefined,
        })
        return
      }

      setSyncBlock(prev => ({
        ...prev,
        chunkIndex,
        content,
        toBlock,
      }))
    },
    [enabled, setSyncBlock, storageKey, syncStatus],
  )

  useEffect(
    function sync() {
      if (
        !enabled ||
        !storageKey ||
        !lastBlockNumber ||
        syncStatus !== 'syncing'
      ) {
        return undefined
      }

      const { fromBlock, toBlock, chunkIndex, hasSyncToMinBlock } = syncBlock

      const pivotBlock =
        hasSyncToMinBlock || !toBlock ? lastBlockNumber : toBlock

      const from = getPreviousFromBlock({
        blockWindowSize,
        chunkIndex: chunkIndex + 1,
        minBlock: fromBlock,
        pivotBlock,
      })
      const to =
        getPreviousFromBlock({
          blockWindowSize,
          chunkIndex,
          minBlock: fromBlock,
          pivotBlock,
        }) - (chunkIndex === 0 ? 0 : 1)
      if (to < from) {
        return undefined
      }

      // eslint-disable-next-line no-console
      console.log(
        `syncing chainId ${chainId} from blockNumber ${from} to blockNumber ${to}`,
      )

      let effectUnmounted = false

      syncBlockWindow(from, to)
        .then(function (blockContent) {
          if (effectUnmounted) {
            return
          }
          const newHasSyncToMinBlock = from <= fromBlock

          if (newHasSyncToMinBlock) {
            setSyncStatus('finished')
          }

          setSyncBlock(function (prev) {
            const newContent = mergeContent(prev.content, blockContent)

            // sync to local storage
            localStorage.setItem(
              storageKey,
              JSON.stringify({
                chunkIndex: newHasSyncToMinBlock ? 0 : chunkIndex + 1,
                content: newContent,
                fromBlock: newHasSyncToMinBlock ? pivotBlock + 1 : fromBlock,
                hasSyncToMinBlock: newHasSyncToMinBlock,
                toBlock: pivotBlock,
              }),
            )

            return {
              ...prev,
              chunkIndex: newHasSyncToMinBlock ? 0 : prev.chunkIndex + 1,
              content: newContent,
              fromBlock: newHasSyncToMinBlock ? pivotBlock + 1 : prev.fromBlock,
              hasSyncToMinBlock: newHasSyncToMinBlock,
            }
          })

          // eslint-disable-next-line no-console
          console.log(
            `chainId ${chainId} from blockNumber ${from} to blockNumber ${to} synced`,
          )
        })
        .catch(function (err) {
          // eslint-disable-next-line no-console
          console.warn(
            `Syncing from blockNumber ${from} to blockNumber ${to} failed: ${err.message}`,
          )
          setSyncStatus('error')
        })

      return function () {
        effectUnmounted = true
      }
    },
    [
      blockWindowSize,
      chainId,
      enabled,
      lastBlockNumber,
      mergeContent,
      setSyncStatus,
      storageKey,
      syncBlock,
      syncBlockWindow,
      syncStatus,
    ],
  )

  return {
    resumeSync: () => setSyncStatus('syncing'),
    syncBlock,
    syncStatus,
  }
}
