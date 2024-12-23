import { type BtcChain } from 'btc-wallet/chains'
import debugConstructor from 'debug'
import PQueue from 'p-queue'
import { type ToBtcWithdrawOperation } from 'types/tunnel'
import { type EnableWorkersDebug } from 'utils/typeUtilities'
import { watchBitcoinWithdrawal } from 'utils/watch/bitcoinWithdrawals'

type WatchBtcWithdrawal = {
  type: 'watch-btc-withdrawal'
  withdrawal: ToBtcWithdrawOperation
}

type AppToWebWorkerActions = EnableWorkersDebug | WatchBtcWithdrawal

export type AppToWorker = Omit<Worker, 'onmessage' | 'postMessage'> & {
  postMessage: (message: AppToWebWorkerActions) => void
}

// Worker is typed with "any", so force type safety for the messages
// (as in runtime all types are stripped, this will continue to work)
type WatchBtcWithdrawalsWorker = Omit<Worker, 'onmessage' | 'postMessage'> & {
  onmessage: (event: MessageEvent<AppToWebWorkerActions>) => void
  postMessage: (event: {
    type: `update-btc-withdrawal-${BtcChain['id']}-${ToBtcWithdrawOperation['transactionHash']}`
    updates: Partial<ToBtcWithdrawOperation>
  }) => void
}

// See https://github.com/Microsoft/TypeScript/issues/20595#issuecomment-587297818
const worker = self as unknown as WatchBtcWithdrawalsWorker

const hemiQueue = new PQueue({ concurrency: 3 })

export const getWithdrawalKey = (withdrawal: ToBtcWithdrawOperation) =>
  `update-btc-withdrawal-${withdrawal.l1ChainId}-${withdrawal.transactionHash}` as const

const postUpdates =
  (withdrawal: ToBtcWithdrawOperation) =>
  (updates: Partial<ToBtcWithdrawOperation> = {}) =>
    worker.postMessage({
      type: getWithdrawalKey(withdrawal),
      updates,
    })

const watchWithdrawal = (withdrawal: ToBtcWithdrawOperation) =>
  hemiQueue.add(() =>
    watchBitcoinWithdrawal(withdrawal).then(postUpdates(withdrawal)),
  )

// wait for the UI to send chain and address once ready
worker.onmessage = function runWorker(e: MessageEvent<AppToWebWorkerActions>) {
  if (e.data.type === 'watch-btc-withdrawal') {
    watchWithdrawal(e.data.withdrawal)
  }
  // See https://github.com/debug-js/debug/issues/916#issuecomment-1539231712
  if (e.data.type === 'enable-debug') {
    debugConstructor.enable(e.data.payload)
  }
}
