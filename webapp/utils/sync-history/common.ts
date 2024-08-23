import { type BlockSyncType } from 'hooks/useSyncHistory/types'
import { CreateSlidingBlockWindow } from 'sliding-block-window/src'

export const getBlockPayload = function ({
  canMove,
  fromBlock,
  lastBlock,
  nextState,
}: {
  canMove: boolean
  fromBlock: BlockSyncType['fromBlock']
  lastBlock: BlockSyncType['toBlock']
  nextState: Parameters<CreateSlidingBlockWindow['onChange']>[0]['nextState']
}) {
  const hasSyncToMinBlock = !canMove
  return {
    // if we finished, we should start from the beginning the next time with the new values
    chunkIndex: hasSyncToMinBlock ? 0 : nextState.windowIndex,
    // If we finished syncing, the upper bound is the last block we've synced up to
    // so next time we should start from that block + 1 (the following one).
    // If we haven't finished, we keep the same value
    fromBlock: hasSyncToMinBlock ? lastBlock + 1 : fromBlock,
    hasSyncToMinBlock,
    // if we finished synced, the next "toBlock" value will be retrieved
    // in runtime, so we must clear it. Otherwise, keep the existing value
    toBlock: hasSyncToMinBlock ? undefined : lastBlock,
  }
}
