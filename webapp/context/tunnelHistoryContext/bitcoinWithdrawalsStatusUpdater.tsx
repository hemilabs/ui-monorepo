'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useBalance } from 'btc-wallet/hooks/useBalance'
import { WithWorker } from 'components/withWorker'
import { useBtcWithdrawals } from 'hooks/useBtcWithdrawals'
import { useConnectedToUnsupportedEvmChain } from 'hooks/useConnectedToUnsupportedChain'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useEffect } from 'react'
import { BtcWithdrawStatus, ToBtcWithdrawOperation } from 'types/tunnel'
import { isPendingOperation } from 'utils/tunnel'
import { hasKeys } from 'utils/utilities'
import { useAccount as useEvmAccount } from 'wagmi'
import {
  type AppToWorker,
  getWithdrawalKey,
} from 'workers/watchBitcoinWithdrawals'

function WatchBitcoinWithdrawal({
  withdrawal,
  worker,
}: {
  withdrawal: ToBtcWithdrawOperation
  worker: AppToWorker
}) {
  const { updateWithdrawal } = useTunnelHistory()
  const { queryKey: btcBalanceQueryKey } = useBalance()
  const queryClient = useQueryClient()

  useEffect(
    function watchWithdrawalUpdates() {
      // Not using useState as 1. this value is local to the effect and
      // 2. to avoid unsubscribing and resubscribing when the state value changes
      let hasWorkedPostedBack = false

      const saveUpdates = function (
        event: MessageEvent<{
          updates: Partial<ToBtcWithdrawOperation>
          type: string
        }>,
      ) {
        // This is needed because this component is rendered per-withdrawal, so each component will receive the posted message
        // for every withdrawal, as there are many withdrawals but only one worker.
        // Of all components, this "if" clause below will be true for only one rendered component - the one belonging to the withdrawal
        const { type, updates } = event.data
        if (type !== getWithdrawalKey(withdrawal)) {
          return
        }
        // next interval will poll again
        hasWorkedPostedBack = true
        if (hasKeys(updates)) {
          // This is needed to invalidate the balance query
          // so the balance is updated in the UI instantly
          if (updates.status === BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED) {
            queryClient.invalidateQueries({ queryKey: btcBalanceQueryKey })
          }
          updateWithdrawal(withdrawal, updates)
        }
      }

      worker.addEventListener('message', saveUpdates)

      // refetch every 15 seconds
      const interval = 15 * 1000

      worker.postMessage({
        type: 'watch-btc-withdrawal',
        withdrawal,
      })

      const intervalId = setInterval(function () {
        if (!hasWorkedPostedBack) {
          return
        }
        worker.postMessage({
          type: 'watch-btc-withdrawal',
          withdrawal,
        })
        // Block posting until a response is received
        hasWorkedPostedBack = false
      }, interval)

      return function cleanup() {
        worker.removeEventListener('message', saveUpdates)
        clearInterval(intervalId)
      }
    },
    [btcBalanceQueryKey, queryClient, updateWithdrawal, withdrawal, worker],
  )

  return null
}

// See https://github.com/vercel/next.js/issues/31009#issuecomment-11463441611
// and https://github.com/vercel/next.js/issues/31009#issuecomment-1338645354
const getWorker = () =>
  new Worker(
    new URL('../../workers/watchBitcoinWithdrawals.ts', import.meta.url),
  )

// Unless the "initiateWithdraw" tx is not confirmed, the other 2 fields should be available
const missingInformation = (withdrawal: ToBtcWithdrawOperation) =>
  withdrawal.status !== BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING &&
  (!withdrawal.timestamp || !withdrawal.uuid)

export function BitcoinWithdrawalsStatusUpdater() {
  const withdrawals = useBtcWithdrawals()
  // Withdrawals  are checked against an hemi address
  const { isConnected } = useEvmAccount()

  const unsupportedChain = useConnectedToUnsupportedEvmChain()

  if (!isConnected || unsupportedChain) {
    return null
  }

  const withdrawalsToWatch = withdrawals.filter(
    withdrawal =>
      isPendingOperation(withdrawal) || missingInformation(withdrawal),
  )

  return (
    <WithWorker getWorker={getWorker}>
      {(worker: AppToWorker) => (
        <>
          {withdrawalsToWatch.map(withdrawal => (
            <WatchBitcoinWithdrawal
              key={withdrawal.transactionHash}
              withdrawal={withdrawal}
              worker={worker}
            />
          ))}
        </>
      )}
    </WithWorker>
  )
}
