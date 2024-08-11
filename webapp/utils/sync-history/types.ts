import { BtcChain } from 'btc-wallet/chains'
import { type Account } from 'btc-wallet/unisat'
import { TunnelOperation } from 'context/tunnelHistoryContext/types'
import {
  HistoryActions,
  type StorageChain,
} from 'context/tunnelHistoryContext/useSyncHistory'
import { type Address, type Chain } from 'viem'

export type HistoryState = {
  syncInfo: Pick<
    StorageChain<TunnelOperation>,
    'chunkIndex' | 'content' | 'fromBlock' | 'hasSyncToMinBlock' | 'toBlock'
  >
}

export type HistorySyncer = {
  syncHistory: () => Promise<void>
}

export type BtcSyncParameters = {
  address: Account
  l1ChainId: BtcChain['id']
  l2ChainId: Chain['id']
}

export type EvmSyncParameters = {
  address: Address
  l1ChainId: Chain['id']
  l2ChainId: Chain['id']
}

export type SaveHistory = (action: HistoryActions) => void

export type SyncHistoryParameters = (EvmSyncParameters | BtcSyncParameters) & {
  l2ChainId: Chain['id']
} & HistoryState
