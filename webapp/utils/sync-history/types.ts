import { Debugger } from 'debug'
import {
  type BlockSyncType,
  type HistoryActions,
  type SyncType,
} from 'hooks/useSyncHistory/types'
import { type RemoteChain } from 'types/chain'
import { TunnelOperation } from 'types/tunnel'
import { type Address, type Chain } from 'viem'

export type SyncInfo<TSyncType extends SyncType> = {
  content: TunnelOperation[]
} & TSyncType

export type ExtendedSyncInfo<TSyncType extends SyncType> = TSyncType &
  (TSyncType extends BlockSyncType
    ? {
        blockWindowSize: number
        minBlockToSync?: number
      }
    : Record<string, never>)

export type HistorySyncer<TSyncType extends SyncType> = {
  address: Address
  debug: Debugger
  depositsSyncInfo: ExtendedSyncInfo<TSyncType>
  l1Chain: Chain
  l2Chain: Chain
  saveHistory: (action: HistoryActions) => void
  withdrawalsSyncInfo: ExtendedSyncInfo<TSyncType>
}

export type SyncHistoryCombinations = {
  l1ChainId: RemoteChain['id']
  l2ChainId: Chain['id']
  address: Address
} & {
  depositsSyncInfo: SyncType
  withdrawalsSyncInfo: SyncType
}
