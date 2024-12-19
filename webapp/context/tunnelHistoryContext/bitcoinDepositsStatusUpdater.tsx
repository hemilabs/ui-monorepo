import { useBtcDeposits } from 'hooks/useBtcDeposits'
import { useConnectedToUnsupportedEvmChain } from 'hooks/useConnectedToUnsupportedChain'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useEffect, useRef } from 'react'
import { BtcDepositOperation, BtcDepositStatus } from 'types/tunnel'
import { hasKeys } from 'utils/utilities'
import { useAccount as useEvmAccount } from 'wagmi'
import { type AppToWorker, getDepositKey } from 'workers/watchBitcoinDeposits'

// put those undefined statuses first
// but then sorted by timestamp (newest first)
const byTimestampDesc = function (
  a: BtcDepositOperation,
  b: BtcDepositOperation,
) {
  if (a.status === b.status) {
    return b.timestamp - a.timestamp
  }
  return (a.status ?? -1) - (b.status ?? -1)
}

const WatchBtcDeposit = function ({
  deposit,
  worker,
}: {
  deposit: BtcDepositOperation
  worker: AppToWorker
}) {
  const { updateDeposit } = useTunnelHistory()

  useEffect(
    function watchDepositUpdates() {
      // Not using useState as 1. this value is local to the effect and
      // 2. to avoid unsubscribing and resubscribing when the state value changes
      let hasWorkedPostedBack = false
      const saveUpdates = function (
        event: MessageEvent<{
          updates: Partial<BtcDepositOperation>
          type: string
        }>,
      ) {
        // This is needed because this component is rendered per-withdrawal, so each component will receive the posted message
        // for every withdrawal, as there are many withdrawals but only one worker.
        // Of all components, this "if" clause below will be true for only one rendered component - the one belonging to the withdrawal
        const { type, updates } = event.data
        if (type !== getDepositKey(deposit)) {
          return
        }
        // next interval will poll again
        hasWorkedPostedBack = true
        if (hasKeys(updates)) {
          updateDeposit(deposit, updates)
        }
      }

      worker.addEventListener('message', saveUpdates)

      // refetch every 30 seconds
      const interval = 30 * 1000

      let intervalId
      // skip polling for disabled states (those whose interval is "false")
      if (typeof interval === 'number') {
        worker.postMessage({
          deposit,
          type: 'watch-btc-deposit',
        })
        intervalId = setInterval(function () {
          if (!hasWorkedPostedBack) {
            return
          }
          worker.postMessage({
            deposit,
            type: 'watch-btc-deposit',
          })
          // Block posting until a response is received
          hasWorkedPostedBack = false
        }, interval)
      }

      return function cleanup() {
        worker.removeEventListener('message', saveUpdates)
        if (intervalId) {
          clearInterval(intervalId)
        }
      }
    },
    [deposit, updateDeposit, worker],
  )

  return null
}

const Watcher = function ({ deposits }: { deposits: BtcDepositOperation[] }) {
  const workerRef = useRef<AppToWorker>(null)

  // This must be done here because there's some weird issue when moving it into a custom hook that prevents
  // the worker from being loaded. It seems that by loading this component dynamically (Which we do), it doesn't get blocked
  // as a different origin when running in localhost. When loading statically from a hook, the error
  // "Failed to construct 'Worker': Script at <path> cannot be accessed from origin localhost" is logged
  useEffect(
    function initWorker() {
      // load the Worker
      workerRef.current = new Worker(
        new URL('../../workers/watchBitcoinDeposits.ts', import.meta.url),
      )

      if (process.env.NEXT_PUBLIC_WORKERS_DEBUG_ENABLE === 'true') {
        // See https://github.com/debug-js/debug/issues/916#issuecomment-1539231712
        const debugString = localStorage.getItem('debug') ?? '*'
        workerRef.current.postMessage({
          payload: debugString,
          type: 'enable-debug',
        })
      }

      return function terminateWorker() {
        if (!workerRef.current) {
          return
        }
        workerRef.current.terminate()
        workerRef.current = null
      }
    },
    [workerRef],
  )

  if (!workerRef.current) {
    return null
  }

  // once the only worker is loaded, render these components that will post to the worker
  // the deposits to watch on intervals
  return (
    <>
      {deposits.map(deposit => (
        <WatchBtcDeposit
          deposit={deposit}
          key={deposit.transactionHash}
          worker={workerRef.current}
        />
      ))}
    </>
  )
}

export const BitcoinDepositsStatusUpdater = function () {
  // Deposits are checked against an hemi address
  const { isConnected } = useEvmAccount()
  const deposits = useBtcDeposits()

  const unsupportedChain = useConnectedToUnsupportedEvmChain()

  if (!isConnected || unsupportedChain) {
    return null
  }

  // Here, btc transactions have not been confirmed, so we must check it
  // in the bitcoin blockchain
  const depositsToWatch = deposits
    .filter(deposit =>
      [
        // Unconfirmed btc transactions, to be watched  in the bitcoin blockchain
        BtcDepositStatus.TX_PENDING,
        // Btc transactions confirmed, to be watched in the hemi blockchain
        BtcDepositStatus.TX_CONFIRMED,
        BtcDepositStatus.BTC_READY_CLAIM,
      ].includes(deposit.status),
    )
    .sort(byTimestampDesc)

  return <Watcher deposits={depositsToWatch} />
}
