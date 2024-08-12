import { hemi, networks } from 'app/networks'
import debugConstructor from 'debug'
import { chainConfiguration } from 'utils/sync-history/chainConfiguration'
import { createEvmSync } from 'utils/sync-history/evm'
import {
  type HistorySyncer,
  type SyncHistoryParameters,
} from 'utils/sync-history/types'
import { type Address, type Chain } from 'viem'
import { sepolia } from 'viem/chains'

// See https://github.com/Microsoft/TypeScript/issues/20595#issuecomment-587297818
const worker = self as unknown as Worker

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
    case hemi.id:
    case sepolia.id:
      return createEvmSync({
        address: address as Address,
        debug,
        depositSyncInfo: {
          ...depositsSyncInfo,
          ...chainConfiguration[l1Chain.id],
        },
        l1Chain,
        l2Chain,
        saveHistory: action => worker.postMessage(action),
        withdrawSyncInfo: {
          ...withdrawalsSyncInfo,
          ...chainConfiguration[l2Chain.id],
        },
      })
    default:
      throw new Error(`Unsupported syncer for L1 chainId ${l1ChainId}`)
  }
}
function syncTunnelHistory(parameters: SyncHistoryParameters) {
  const syncer = createSyncer(parameters)

  return syncer.syncHistory()
}

type EnableDebug = { type: 'enable-debug'; payload: string }
type StartSyncing = SyncHistoryParameters & { type: 'start' }
// wait for the UI to send chain and address once ready
worker.onmessage = function runWorker(
  e: MessageEvent<EnableDebug | StartSyncing>,
) {
  if (e.data.type === 'start') {
    syncTunnelHistory(e.data)
  }
  // See https://github.com/debug-js/debug/issues/916#issuecomment-1539231712
  if (e.data.type === 'enable-debug') {
    debugConstructor.enable(e.data.payload)
  }
}
