import debugConstructor from 'debug'
import PQueue from 'p-queue'
import { type EvmDepositOperation } from 'types/tunnel'
import { type EnableWorkersDebug } from 'utils/typeUtilities'
import { hasKeys } from 'utils/utilities'
import { watchEvmDeposit } from 'utils/watch/evmDeposits'
import { typeWorker } from 'utils/workers'
import { Chain, Hash } from 'viem'

import { analyzeEvmDepositPolling } from './pollings/analyzeEvmDepositPolling'

const debug = debugConstructor('watch-evm-deposits-worker')

const queue = new PQueue({ concurrency: 5 })

type WatchEvmDeposit = {
  deposit: EvmDepositOperation
  type: 'watch-evm-deposit'
  focusedDepositHash?: Hash
}

type AppToWebWorkerActions = EnableWorkersDebug | WatchEvmDeposit

export type AppToWorker = Omit<Worker, 'onmessage' | 'postMessage'> & {
  postMessage: (message: AppToWebWorkerActions) => void
}

// Worker is typed with "any", so force type safety for the messages
// (as in runtime all types are stripped, this will continue to work)
type WatchEvmDepositsWorker = Omit<Worker, 'onmessage' | 'postMessage'> & {
  onmessage: (event: MessageEvent<AppToWebWorkerActions>) => void
  postMessage: (event: {
    type: `update-evm-deposit-${Chain['id']}-${EvmDepositOperation['transactionHash']}`
    updates: Partial<EvmDepositOperation>
  }) => void
}

const worker = typeWorker<WatchEvmDepositsWorker>(self)

export const getDepositKey = (deposit: EvmDepositOperation) =>
  `update-evm-deposit-${deposit.l1ChainId}-${deposit.transactionHash}` as const

const postUpdates = (deposit: EvmDepositOperation) =>
  function (updates: Partial<EvmDepositOperation> = {}) {
    if (hasKeys(updates)) {
      debug('Sending changes for deposit %s', deposit.transactionHash)
    } else {
      debug('No changes for deposit %s', deposit.transactionHash)
    }
    worker.postMessage({
      type: getDepositKey(deposit),
      updates,
    })
  }

function watchDeposit({
  deposit,
  focusedDepositHash,
}: Omit<WatchEvmDeposit, 'type'>) {
  const { priority } = analyzeEvmDepositPolling({
    deposit,
    focusedDepositHash,
  })

  return queue.add(() => watchEvmDeposit(deposit).then(postUpdates(deposit)), {
    priority,
  })
}

// wait for the UI to send chain and address once ready
worker.onmessage = function runWorker(e: MessageEvent<AppToWebWorkerActions>) {
  if (!e?.data) {
    return
  }
  if (e.data.type === 'watch-evm-deposit') {
    watchDeposit({
      deposit: e.data.deposit,
      focusedDepositHash: e.data.focusedDepositHash,
    })
  }
  // See https://github.com/debug-js/debug/issues/916#issuecomment-1539231712
  if (e.data.type === 'enable-debug') {
    debugConstructor.enable(e.data.payload)
  }
}
