import { BtcChain } from 'btc-wallet/chains'
import { type Account } from 'btc-wallet/unisat'
import { Debugger } from 'debug'
import { HistoryActions, type StorageChain } from 'hooks/useSyncHistory/types'
import { TunnelOperation } from 'types/tunnel'
import { type Address, type Chain } from 'viem'

export type SyncInfo = Pick<
  StorageChain<TunnelOperation>,
  'chunkIndex' | 'content' | 'fromBlock' | 'hasSyncToMinBlock' | 'toBlock'
>

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

export type SyncHistoryParameters = (EvmSyncParameters | BtcSyncParameters) & {
  l2ChainId: Chain['id']
} & {
  depositsSyncInfo: Omit<SyncInfo, 'content'>
  withdrawalsSyncInfo: Omit<SyncInfo, 'content'>
}

type ExtendedSyncInfo = Omit<SyncInfo, 'content'> & {
  blockWindowSize: number
  minBlockToSync?: number
}

export type HistorySyncer = Pick<EvmSyncParameters, 'address'> & {
  debug: Debugger
  depositsSyncInfo: ExtendedSyncInfo
  l1Chain: Chain
  l2Chain: Chain
  saveHistory: (action: HistoryActions) => void
  withdrawalsSyncInfo: ExtendedSyncInfo
}
