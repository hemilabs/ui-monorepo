'use client'

import { useQueryClient } from '@tanstack/react-query'
import { WithWorker } from 'components/withWorker'
import { useBitcoinBalance } from 'hooks/useBitcoinBalance'
import { useBtcDeposits } from 'hooks/useBtcDeposits'
import { useConnectedToUnsupportedEvmChain } from 'hooks/useConnectedToUnsupportedChain'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useEffect } from 'react'
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
  const { queryKey: btcBalanceQueryKey } = useBitcoinBalance()
  const queryClient = useQueryClient()

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
          // This is needed to invalidate the balance query
          // so the balance is updated in the UI instantly
          if (
            updates.status === BtcDepositStatus.BTC_DEPOSITED ||
            updates.status === BtcDepositStatus.BTC_DEPOSITED_MANUALLY
          ) {
            queryClient.invalidateQueries({ queryKey: btcBalanceQueryKey })
          }
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
    [btcBalanceQueryKey, deposit, queryClient, updateDeposit, worker],
  )

  return null
}

// See https://github.com/vercel/next.js/issues/31009#issuecomment-11463441611
// and https://github.com/vercel/next.js/issues/31009#issuecomment-1338645354
const getWorker = () =>
  new Worker(new URL('../../workers/watchBitcoinDeposits.ts', import.meta.url))

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
        BtcDepositStatus.BTC_TX_PENDING,
        // Btc transactions on Bitcoin confirmed, to be watched in the hemi blockchain
        BtcDepositStatus.BTC_TX_CONFIRMED,
        BtcDepositStatus.READY_TO_MANUAL_CONFIRM,
        BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMING,
      ].includes(deposit.status),
    )
    .sort(byTimestampDesc)

  return (
    <WithWorker getWorker={getWorker}>
      {(worker: AppToWorker) => (
        // once the only worker is loaded, render these components that will post to the worker
        // the deposits to watch on intervals
        <>
          {depositsToWatch.map(deposit => (
            <WatchBtcDeposit
              deposit={deposit}
              key={deposit.transactionHash}
              worker={worker}
            />
          ))}
        </>
      )}
    </WithWorker>
  )
}
