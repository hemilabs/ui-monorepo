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
  storageKey: string | undefined
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

export const defaultSyncState = <T>(): SyncState<T> => ({
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
  const [hasCheckedLocalStorage, setHasCheckedLocalStorage] = useState(false)
  const [syncBlock, setSyncBlock] = useState<SyncState<T>>({
    ...defaultSyncState<T>(),
    fromBlock: minBlockToSync,
  })
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing')

  useEffect(
    function () {
      if (!storageKey || !hasCheckedLocalStorage) {
        setHasCheckedLocalStorage(false)
        setSyncBlock({
          ...defaultSyncState<T>(),
          fromBlock: minBlockToSync,
        })
      }
    },
    [
      hasCheckedLocalStorage,
      minBlockToSync,
      setSyncBlock,
      setHasCheckedLocalStorage,
      storageKey,
    ],
  )

  // This effect restores what is stored from local storage, or leaves the default state if nothing was found
  useEffect(
    function restoreFromLocalStorage() {
      if (hasCheckedLocalStorage || !storageKey) {
        return
      }
      setHasCheckedLocalStorage(true)
      const storedItem = localStorage.getItem(storageKey)
      if (!storedItem) {
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
    [
      hasCheckedLocalStorage,
      setHasCheckedLocalStorage,
      setSyncBlock,
      storageKey,
    ],
  )

  useEffect(
    function sync() {
      if (
        !enabled ||
        !storageKey ||
        !lastBlockNumber ||
        !hasCheckedLocalStorage ||
        syncStatus !== 'syncing'
      ) {
        return undefined
      }

      const { fromBlock, toBlock, chunkIndex, hasSyncToMinBlock } = syncBlock

      const pivotBlock =
        hasSyncToMinBlock || toBlock === undefined ? lastBlockNumber : toBlock

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

            return {
              chunkIndex: newHasSyncToMinBlock ? 0 : prev.chunkIndex + 1,
              content: newContent,
              fromBlock: newHasSyncToMinBlock ? pivotBlock + 1 : prev.fromBlock,
              hasSyncToMinBlock: newHasSyncToMinBlock,
              toBlock: pivotBlock,
            }
          })
        })
        .catch(function () {
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
      hasCheckedLocalStorage,
      lastBlockNumber,
      mergeContent,
      setSyncStatus,
      storageKey,
      syncBlock,
      syncBlockWindow,
      syncStatus,
    ],
  )

  useEffect(
    function offloadToLocalStorage() {
      if (!storageKey || !hasCheckedLocalStorage) {
        return undefined
      }
      // to avoid offloading on every state update, wait for 0.5 second
      // before actually proceeding
      const timeoutId = setTimeout(function () {
        localStorage.setItem(storageKey, JSON.stringify(syncBlock))
      }, 500)
      return () => clearTimeout(timeoutId)
    },
    [hasCheckedLocalStorage, syncBlock, storageKey],
  )

  return {
    resumeSync: () => setSyncStatus('syncing'),
    setSyncBlock,
    syncBlock,
    syncStatus,
  }
}
