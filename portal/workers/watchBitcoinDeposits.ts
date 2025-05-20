import { BtcChain } from 'btc-wallet/chains'
import { BtcTransaction } from 'btc-wallet/unisat'
import debugConstructor from 'debug'
import PQueue from 'p-queue'
import { type BtcDepositOperation, BtcDepositStatus } from 'types/tunnel'
import { type EnableWorkersDebug } from 'utils/typeUtilities'
import {
  watchDepositOnBitcoin,
  watchDepositOnHemi,
} from 'utils/watch/bitcoinDeposits'
import { typeWorker } from 'utils/workers'

type WatchBtcDeposit = {
  deposit: BtcDepositOperation
  type: 'watch-btc-deposit'
}

type AppToWebWorkerActions = EnableWorkersDebug | WatchBtcDeposit

export type AppToWorker = Omit<Worker, 'onmessage' | 'postMessage'> & {
  postMessage: (message: AppToWebWorkerActions) => void
}

// Worker is typed with "any", so force type safety for the messages
// (as in runtime all types are stripped, this will continue to work)
type WatchBtcDepositsWorker = Omit<Worker, 'onmessage' | 'postMessage'> & {
  onmessage: (event: MessageEvent<AppToWebWorkerActions>) => void
  postMessage: (event: {
    type: `update-deposit-${BtcChain['id']}-${BtcTransaction}`
    updates: Partial<BtcDepositOperation>
  }) => void
}

const worker = typeWorker<WatchBtcDepositsWorker>(self)

// concurrently avoid overloading both blockchains
const bitcoinQueue = new PQueue({ concurrency: 3 })
const hemiQueue = new PQueue({ concurrency: 3 })

export const getDepositKey = (deposit: BtcDepositOperation) =>
  `update-deposit-${deposit.l1ChainId}-${deposit.transactionHash}` as const

const postUpdates =
  (deposit: BtcDepositOperation) =>
  (updates: Partial<BtcDepositOperation> = {}) =>
    worker.postMessage({
      type: getDepositKey(deposit),
      updates,
    })

const watchDeposit = function (deposit: BtcDepositOperation) {
  if (deposit.status === BtcDepositStatus.BTC_TX_PENDING) {
    bitcoinQueue.add(() =>
      watchDepositOnBitcoin(deposit).then(postUpdates(deposit)),
    )
  } else {
    hemiQueue.add(() => watchDepositOnHemi(deposit).then(postUpdates(deposit)))
  }
}

// wait for the UI to send chain and address once ready
worker.onmessage = function runWorker(e: MessageEvent<AppToWebWorkerActions>) {
  if (!e?.data) {
    return
  }
  if (e.data.type === 'watch-btc-deposit') {
    watchDeposit(e.data.deposit)
  }
  // See https://github.com/debug-js/debug/issues/916#issuecomment-1539231712
  if (e.data.type === 'enable-debug') {
    debugConstructor.enable(e.data.payload)
  }
}
