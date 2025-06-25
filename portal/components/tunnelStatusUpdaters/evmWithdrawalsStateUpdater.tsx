import { useQueryClient } from '@tanstack/react-query'
import { WithWorker } from 'components/withWorker'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useConnectedToUnsupportedEvmChain } from 'hooks/useConnectedToUnsupportedChain'
import { useToEvmWithdrawals } from 'hooks/useToEvmWithdrawals'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { MessageStatus, ToEvmWithdrawOperation } from 'types/tunnel'
import { isNativeAddress } from 'utils/nativeToken'
import {
  isPendingOperation,
  isWithdrawalMissingInformation,
} from 'utils/tunnel'
import { hasKeys } from 'utils/utilities'
import { Hash } from 'viem'
import { useAccount } from 'wagmi'
import { analyzeEvmWithdrawalPolling } from 'workers/pollings/analyzeEvmWithdrawalPolling'
import {
  type AppToWorker,
  getUpdateWithdrawalKey,
} from 'workers/watchEvmWithdrawals'

const WatchEvmWithdrawal = function ({
  withdrawal,
  worker,
}: {
  withdrawal: ToEvmWithdrawOperation
  worker: AppToWorker
}) {
  const { updateWithdrawal } = useTunnelHistory()
  const { queryKey: erc20BalanceQueryKey } = useTokenBalance(
    withdrawal.l1ChainId,
    withdrawal.l1Token,
  )
  const { queryKey: nativeTokenBalanceQueryKey } = useNativeTokenBalance(
    withdrawal.l1ChainId,
  )
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const txHash = searchParams.get('txHash')

  useEffect(
    function watchWithdrawalUpdates() {
      // Not using useState as 1. this value is local to the effect and
      // 2. to avoid unsubscribing and resubscribing when the state value changes
      let hasWorkedPostedBack = false
      const saveUpdates = function (
        event: MessageEvent<{
          updates: Partial<ToEvmWithdrawOperation>
          type: string
        }>,
      ) {
        // This is needed because this component is rendered per-withdrawal, so each component will receive the posted message
        // for every withdrawal, as there are many withdrawals but only one worker.
        // Of all components, this "if" clause below will be true for only one rendered component - the one belonging to the withdrawal
        const { type, updates } = event.data
        if (type !== getUpdateWithdrawalKey(withdrawal)) {
          return
        }
        // next interval will poll again
        hasWorkedPostedBack = true
        if (hasKeys(updates)) {
          // This is needed to invalidate the balance query when the withdrawal is relayed
          // so the balance is updated in the UI instantly
          if (updates.status === MessageStatus.RELAYED) {
            const balanceQueryKey = isNativeAddress(withdrawal.l1Token)
              ? nativeTokenBalanceQueryKey
              : erc20BalanceQueryKey

            queryClient.invalidateQueries({ queryKey: balanceQueryKey })
          }
          updateWithdrawal(withdrawal, updates)
        }
      }

      worker.addEventListener('message', saveUpdates)

      const focusedWithdrawalHash = txHash as Hash

      const { interval } = analyzeEvmWithdrawalPolling({
        focusedWithdrawalHash,
        withdrawal,
      })

      worker.postMessage({
        focusedWithdrawalHash,
        type: 'watch-evm-withdrawal',
        withdrawal,
      })

      const intervalId = setInterval(function () {
        if (!hasWorkedPostedBack) {
          return
        }
        worker.postMessage({
          focusedWithdrawalHash,
          type: 'watch-evm-withdrawal',
          withdrawal,
        })
        // Block posting until a response is received
        hasWorkedPostedBack = false
      }, interval)

      return function cleanup() {
        worker.removeEventListener('message', saveUpdates)
        if (intervalId) {
          clearInterval(intervalId)
        }
      }
    },
    [
      erc20BalanceQueryKey,
      nativeTokenBalanceQueryKey,
      queryClient,
      updateWithdrawal,
      txHash,
      withdrawal,
      worker,
    ],
  )

  return null
}

// See https://github.com/vercel/next.js/issues/31009#issuecomment-11463441611
// and https://github.com/vercel/next.js/issues/31009#issuecomment-1338645354
const getWorker = () =>
  new Worker(new URL('../../workers/watchEvmWithdrawals.ts', import.meta.url))

export const EvmWithdrawalsStateUpdater = function () {
  const { isConnected } = useAccount()

  const withdrawals = useToEvmWithdrawals()

  const unsupportedChain = useConnectedToUnsupportedEvmChain()

  if (!isConnected || unsupportedChain) {
    return null
  }

  const withdrawalsToWatch = withdrawals.filter(
    w => isWithdrawalMissingInformation(w) || isPendingOperation(w),
  )

  return (
    <WithWorker getWorker={getWorker}>
      {(worker: AppToWorker) => (
        // once the only worker is loaded, render these components that will post to the worker
        // the withdrawals to watch on intervals
        <>
          {withdrawalsToWatch.map(w => (
            <WatchEvmWithdrawal
              key={w.transactionHash}
              withdrawal={w}
              worker={worker}
            />
          ))}
        </>
      )}
    </WithWorker>
  )
}
