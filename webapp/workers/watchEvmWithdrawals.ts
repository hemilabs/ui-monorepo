import { MessageStatus } from '@eth-optimism/sdk'
import debugConstructor from 'debug'
import PQueue from 'p-queue'
import pMemoize from 'promise-mem'
import { RemoteChain } from 'types/chain'
import {
  type ToEvmWithdrawOperation,
  type WithdrawTunnelOperation,
} from 'types/tunnel'
import { findChainById } from 'utils/chain'
import { createQueuedCrossChainMessenger } from 'utils/crossChainMessenger'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import { createPublicProvider } from 'utils/providers'
import { type EnableWorkersDebug } from 'utils/typeUtilities'
import { hasKeys } from 'utils/utilities'
import { type Chain, type Hash } from 'viem'

const queue = new PQueue({ concurrency: 2 })

const debug = debugConstructor('watch-evm-withdrawals-worker')

export const getUpdateWithdrawalKey = (withdrawal: WithdrawTunnelOperation) =>
  `update-withdrawal-${withdrawal.l2ChainId}-${withdrawal.transactionHash}` as const

type WatchWithdrawal = {
  type: 'watch-withdrawal'
  withdrawal: ToEvmWithdrawOperation
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

// See https://github.com/Microsoft/TypeScript/issues/20595#issuecomment-587297818
const worker = self as unknown as WatchEvmWithdrawalsWorker

// See https://www.npmjs.com/package/p-queue#priority
const getPriority = function (withdrawal: ToEvmWithdrawOperation) {
  // prioritize those with missing vital information
  if (!withdrawal.timestamp || withdrawal.status === undefined) {
    return 2
  }
  if (
    [MessageStatus.READY_TO_PROVE, MessageStatus.READY_FOR_RELAY].includes(
      withdrawal.status,
    )
  ) {
    return 1
  }
  return 0
}

const getBlockTimestamp = (withdrawal: ToEvmWithdrawOperation) =>
  async function (
    blockNumber: number | undefined,
  ): Promise<[number?, number?]> {
    // Can't return a block if we don't know the number
    if (blockNumber === undefined) {
      return []
    }
    // Block and timestamp already known - return them
    if (withdrawal.timestamp) {
      return [blockNumber, withdrawal.timestamp]
    }
    const { timestamp } = await getEvmBlock(blockNumber, withdrawal.l2ChainId)
    return [blockNumber, Number(timestamp)]
  }

const getTransactionBlockNumber = function (
  withdrawal: ToEvmWithdrawOperation,
) {
  if (withdrawal.blockNumber) {
    return Promise.resolve(withdrawal.blockNumber)
  }
  return getEvmTransactionReceipt(
    withdrawal.transactionHash,
    withdrawal.l2ChainId,
  ).then(transactionReceipt =>
    // return undefined if TX is not found - might have not been confirmed yet
    transactionReceipt ? Number(transactionReceipt.blockNumber) : undefined,
  )
}

// Memoized cross chain messenger as this will be created by many withdrawals
const getCrossChainMessenger = pMemoize(
  function (l1Chain: Chain, l2Chain: Chain) {
    const l1Provider = createPublicProvider(
      l1Chain.rpcUrls.default.http[0],
      l1Chain,
    )

    const l2Provider = createPublicProvider(
      l2Chain.rpcUrls.default.http[0],
      l2Chain,
    )

    debug(
      'Creating cross chain messenger for L1 %s and L2 %s',
      l1Chain.id,
      l2Chain.id,
    )

    return createQueuedCrossChainMessenger({
      l1ChainId: l1Chain.id,
      l1Signer: l1Provider,
      l2Chain,
      l2Signer: l2Provider,
    })
  },
  { resolver: (l1Chain, l2Chain) => `${l1Chain.id}-${l2Chain.id}` },
)

const watchWithdrawal = (withdrawal: ToEvmWithdrawOperation) =>
  // Use a queue to avoid firing lots of requests. Throttling may also not work because it throttles
  // for a specific period of time and depending on load, requests may take up to 5 seconds to complete
  // so this let us to query up to <concurrency> checks for status at the same time
  queue.add(
    async function checkWithdrawalUpdates() {
      // as this worker watches withdrawals to EVM chains, l1Chain will be (EVM) Chain
      const l1Chain = findChainById(withdrawal.l1ChainId) as Chain
      // L2 are always EVM
      const l2Chain = findChainById(withdrawal.l2ChainId) as Chain

      const crossChainMessenger = await getCrossChainMessenger(l1Chain, l2Chain)
      debug('Checking withdrawal %s', withdrawal.transactionHash)

      const updates: Partial<ToEvmWithdrawOperation> = {}

      const receipt = await getEvmTransactionReceipt(
        withdrawal.transactionHash,
        withdrawal.l2ChainId,
      )

      if (!receipt) {
        debug('Withdrawal %s is not confirmed yet', withdrawal.transactionHash)
        worker.postMessage({
          type: getUpdateWithdrawalKey(withdrawal),
          updates,
        })
        return
      }

      const [status, [blockNumber, timestamp]] = await Promise.all([
        crossChainMessenger.getMessageStatus(
          withdrawal.transactionHash,
          // default value, but we want to set direction
          0,
          withdrawal.direction,
        ),
        getTransactionBlockNumber(withdrawal).then(
          getBlockTimestamp(withdrawal),
        ),
      ])

      if (withdrawal.status !== status) {
        debug(
          'Withdrawal %s status changed from %s to %s',
          withdrawal.transactionHash,
          withdrawal.status ?? 'none',
          status,
        )
        updates.status = status
      }
      if (withdrawal.blockNumber !== blockNumber) {
        debug(
          'Saving block number %s for withdrawal %s',
          blockNumber,
          withdrawal.transactionHash,
        )
        updates.blockNumber = blockNumber
      }
      if (withdrawal.timestamp !== timestamp) {
        debug(
          'Saving timestamp %s for withdrawal %s',
          timestamp,
          withdrawal.transactionHash,
        )
        updates.timestamp = timestamp
      }

      if (hasKeys(updates)) {
        debug('Sending changes for withdrawal %s', withdrawal.transactionHash)
      } else {
        debug('No changes for withdrawal %s', withdrawal.transactionHash)
      }

      worker.postMessage({
        type: getUpdateWithdrawalKey(withdrawal),
        updates,
      })
    },
    {
      // Give more priority to those that require polling and are not ready or are missing information
      // because if ready, after the operation they will change their status automatically and will have
      // the longest waiting period of all withdrawals, as the others have been waiting for longer
      priority: getPriority(withdrawal),
    },
  )

// wait for the UI to send chain and address once ready
worker.onmessage = function runWorker(e: MessageEvent<AppToWebWorkerActions>) {
  if (e.data.type === 'watch-withdrawal') {
    watchWithdrawal(e.data.withdrawal)
  }
  // See https://github.com/debug-js/debug/issues/916#issuecomment-1539231712
  if (e.data.type === 'enable-debug') {
    debugConstructor.enable(e.data.payload)
  }
}
