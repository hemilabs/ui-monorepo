import { bitcoinTestnet, bitcoinMainnet } from 'btc-wallet/chains'
import {
  type BlockSyncType,
  type HistoryActions,
  type TransactionListSyncType,
} from 'context/tunnelHistoryContext/types'
import debugConstructor from 'debug'
import { mainnet } from 'networks/mainnet'
import { sepolia } from 'networks/sepolia'
import { findChainById } from 'utils/chain'
import { createBitcoinSync } from 'utils/sync-history/bitcoin'
import { chainConfiguration } from 'utils/sync-history/chainConfiguration'
import { createEvmSync } from 'utils/sync-history/evm'
import {
  type ExtendedSyncInfo,
  type SyncHistoryCombinations,
} from 'utils/sync-history/types'
import { type EnableWorkersDebug } from 'utils/typeUtilities'
import { typeWorker } from 'utils/workers'
import { type Address, type Chain } from 'viem'

type StartSyncing = { type: 'start' } & SyncHistoryCombinations

type AppToWebWorkerActions = EnableWorkersDebug | StartSyncing

// Worker is typed with "any", so force type safety for the messages
// (as in runtime all types are stripped, this will continue to work)
export type AppToWebWorker = Omit<Worker, 'onmessage' | 'postMessage'> & {
  onmessage: (event: MessageEvent<HistoryActions>) => void
  postMessage: (message: AppToWebWorkerActions) => void
}
type SyncWebWorker = Omit<Worker, 'onmessage' | 'postMessage'> & {
  onmessage: (event: MessageEvent<AppToWebWorkerActions>) => void
  postMessage: (event: HistoryActions) => void
}

const worker = typeWorker<SyncWebWorker>(self)

const saveHistory = (action: HistoryActions) => worker.postMessage(action)

const createSyncer = function ({
  address,
  depositsSyncInfo,
  l1ChainId,
  l2ChainId,
  withdrawalsSyncInfo,
}: SyncHistoryCombinations) {
  const l1Chain = findChainById(l1ChainId)
  // L2 are always EVM
  const l2Chain = findChainById(l2ChainId) as Chain

  const debug = debugConstructor(
    `history-sync-worker:l1:${l1ChainId}:l2:${l2ChainId}`,
  )

  switch (l1Chain.id) {
    case bitcoinMainnet.id:
    case bitcoinTestnet.id:
      return createBitcoinSync({
        address,
        debug,
        depositsSyncInfo:
          depositsSyncInfo as ExtendedSyncInfo<TransactionListSyncType>,
        l1Chain,
        l2Chain,
        saveHistory,
        withdrawalsSyncInfo: {
          ...(withdrawalsSyncInfo as ExtendedSyncInfo<BlockSyncType>),
          // depending on L1 (bitcoin) chain, get config for L2 (Hemi)
          ...chainConfiguration[l1Chain.id],
        },
      })
    case mainnet.id:
    case sepolia.id:
      return createEvmSync({
        address: address as Address,
        debug,
        depositsSyncInfo: {
          ...(depositsSyncInfo as BlockSyncType),
          ...chainConfiguration[l1Chain.id],
        },
        l1Chain,
        l2Chain,
        saveHistory,
        withdrawalsSyncInfo: {
          ...(withdrawalsSyncInfo as BlockSyncType),
          ...chainConfiguration[l2Chain.id],
        },
      })
    default:
      throw new Error(`Unsupported syncer for L1 chainId ${l1ChainId}`)
  }
}
async function syncTunnelHistory(parameters: StartSyncing) {
  const syncer = createSyncer(parameters)

  await syncer.syncHistory()
  worker.postMessage({
    payload: { chainId: parameters.l1ChainId },
    type: 'sync-finished',
  })
}

// wait for the UI to send chain and address once ready
worker.onmessage = function runWorker(e: MessageEvent<AppToWebWorkerActions>) {
  if (e.data.type === 'start') {
    syncTunnelHistory(e.data)
  }
  // See https://github.com/debug-js/debug/issues/916#issuecomment-1539231712
  if (e.data.type === 'enable-debug') {
    debugConstructor.enable(e.data.payload)
  }
}
