import { networks } from 'app/networks'
import debugConstructor from 'debug'
import { HistoryActions } from 'hooks/useSyncHistory/types'
import { chainConfiguration } from 'utils/sync-history/chainConfiguration'
import { createEvmSync } from 'utils/sync-history/evm'
import {
  type HistorySyncer,
  type SyncHistoryParameters,
} from 'utils/sync-history/types'
import { type Address, type Chain } from 'viem'
import { sepolia } from 'viem/chains'

type EnableDebug = { type: 'enable-debug'; payload: string }
type StartSyncing = SyncHistoryParameters & { type: 'start' }

type HistoryWorkerEvents = MessageEvent<
  EnableDebug | HistoryActions | StartSyncing
>

// Worker is typed with "any", so force type safety for the messages
// (as in runtime all types are stripped, this will continue to work)
export type SyncWebWorker = Omit<Worker, 'postMessage'> & {
  postMessage: (event: HistoryWorkerEvents['data']) => void
}

// See https://github.com/Microsoft/TypeScript/issues/20595#issuecomment-587297818
const worker = self as unknown as SyncWebWorker

const createSyncer = function ({
  address,
  depositsSyncInfo,
  l1ChainId,
  l2ChainId,
  withdrawalsSyncInfo,
}: SyncHistoryParameters): HistorySyncer {
  const l1Chain = networks.find(n => n.id === l1ChainId)
  // L2 are always EVM
  const l2Chain = networks.find(n => n.id === l2ChainId) as Chain

  const debug = debugConstructor(
    `history-sync-worker:l1:${l1ChainId}:l2:${l2ChainId}`,
  )

  switch (l1Chain.id) {
    // See https://github.com/hemilabs/ui-monorepo/issues/345
    // case bitcoin.id:
    //   return createBitcoinSync({
    //     address,
    //     debug,
    //     chain,
    //   })
    case sepolia.id:
      return createEvmSync({
        address: address as Address,
        debug,
        depositsSyncInfo: {
          ...depositsSyncInfo,
          ...chainConfiguration[l1Chain.id],
        },
        l1Chain,
        l2Chain,
        saveHistory: action => worker.postMessage(action),
        withdrawalsSyncInfo: {
          ...withdrawalsSyncInfo,
          ...chainConfiguration[l2Chain.id],
        },
      })
    default:
      throw new Error(`Unsupported syncer for L1 chainId ${l1ChainId}`)
  }
}
async function syncTunnelHistory(parameters: SyncHistoryParameters) {
  const syncer = createSyncer(parameters)

  await syncer.syncHistory()
  worker.postMessage({ type: 'sync-finished' })
}

// wait for the UI to send chain and address once ready
worker.onmessage = function runWorker(e: HistoryWorkerEvents) {
  if (e.data.type === 'start') {
    syncTunnelHistory(e.data)
  }
  // See https://github.com/debug-js/debug/issues/916#issuecomment-1539231712
  if (e.data.type === 'enable-debug') {
    debugConstructor.enable(e.data.payload)
  }
}
