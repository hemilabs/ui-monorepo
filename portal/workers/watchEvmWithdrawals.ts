import debugConstructor from 'debug'
import PQueue from 'p-queue'
import { RemoteChain } from 'types/chain'
import {
  type ToEvmWithdrawOperation,
  type WithdrawTunnelOperation,
} from 'types/tunnel'
import { type EnableWorkersDebug } from 'utils/typeUtilities'
import { hasKeys } from 'utils/utilities'
import { watchEvmWithdrawal } from 'utils/watch/evmWithdrawals'
import { typeWorker } from 'utils/workers'
import { type Hash } from 'viem'

import { analyzeEvmWithdrawalPolling } from './pollings/analyzeEvmWithdrawalPolling'

const queue = new PQueue({ concurrency: 2 })

const debug = debugConstructor('watch-evm-withdrawals-worker')

export const getUpdateWithdrawalKey = (withdrawal: WithdrawTunnelOperation) =>
  `update-withdrawal-${withdrawal.l2ChainId}-${withdrawal.transactionHash}` as const

type WatchWithdrawal = {
  type: 'watch-evm-withdrawal'
  withdrawal: ToEvmWithdrawOperation
  focusedWithdrawalHash?: Hash
}

type AppToWebWorkerActions = EnableWorkersDebug | WatchWithdrawal

export type AppToWorker = Omit<Worker, 'onmessage' | 'postMessage'> & {
  postMessage: (message: AppToWebWorkerActions) => void
}

// Worker is typed with "any", so force type safety for the messages
// (as in runtime all types are stripped, this will continue to work)
type WatchEvmWithdrawalsWorker = Omit<Worker, 'onmessage' | 'postMessage'> & {
  onmessage: (event: MessageEvent<AppToWebWorkerActions>) => void
  postMessage: (event: {
    type: `update-withdrawal-${RemoteChain['id']}-${Hash}`
    updates: Partial<ToEvmWithdrawOperation>
  }) => void
}

const worker = typeWorker<WatchEvmWithdrawalsWorker>(self)

const postUpdates = (withdrawal: ToEvmWithdrawOperation) =>
  function (updates: Partial<ToEvmWithdrawOperation> = {}) {
    if (hasKeys(updates)) {
      debug('Sending changes for withdrawal %s', withdrawal.transactionHash)
    } else {
      debug('No changes for withdrawal %s', withdrawal.transactionHash)
    }
    worker.postMessage({
      type: getUpdateWithdrawalKey(withdrawal),
      updates,
    })
  }

function watchWithdrawal({
  focusedWithdrawalHash,
  withdrawal,
}: Omit<WatchWithdrawal, 'type'>) {
  const { priority } = analyzeEvmWithdrawalPolling({
    focusedWithdrawalHash,
    withdrawal,
  })

  // Use a queue to avoid firing lots of requests. Throttling may also not work because it throttles
  // for a specific period of time and depending on load, requests may take up to 5 seconds to complete
  // so this let us to query up to <concurrency> checks for status at the same time
  return queue.add(
    () => watchEvmWithdrawal(withdrawal).then(postUpdates(withdrawal)),
    {
      // Give more priority to those that require polling and are not ready or are missing information
      // because if ready, after the operation they will change their status automatically and will have
      // the longest waiting period of all withdrawals, as the others have been waiting for longer
      priority,
    },
  )
}

// wait for the UI to send chain and address once ready
worker.onmessage = function runWorker(e: MessageEvent<AppToWebWorkerActions>) {
  if (!e?.data) {
    return
  }

  if (e.data.type === 'watch-evm-withdrawal') {
    watchWithdrawal({
      focusedWithdrawalHash: e.data.focusedWithdrawalHash,
      withdrawal: e.data.withdrawal,
    })
  }

  // See https://github.com/debug-js/debug/issues/916#issuecomment-1539231712
  if (e.data.type === 'enable-debug') {
    debugConstructor.enable(e.data.payload)
  }
}
