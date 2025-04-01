import { useQueryClient } from '@tanstack/react-query'
import { WithWorker } from 'components/withWorker'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useConnectedToUnsupportedEvmChain } from 'hooks/useConnectedToUnsupportedChain'
import { useEvmDeposits } from 'hooks/useEvmDeposits'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useEffect } from 'react'
import { EvmDepositOperation, EvmDepositStatus } from 'types/tunnel'
import { isNativeAddress } from 'utils/nativeToken'
import { isPendingOperation } from 'utils/tunnel'
import { hasKeys } from 'utils/utilities'
import { useAccount } from 'wagmi'
import { type AppToWorker, getDepositKey } from 'workers/watchEvmDeposits'

const WatchEvmDeposit = function ({
  deposit,
  worker,
}: {
  deposit: EvmDepositOperation
  worker: AppToWorker
}) {
  const { updateDeposit } = useTunnelHistory()
  const { queryKey: erc20BalanceQueryKey } = useTokenBalance(
    deposit.l2ChainId,
    deposit.l2Token,
  )
  const { queryKey: nativeTokenBalanceQueryKey } = useNativeTokenBalance(
    deposit.l2ChainId,
  )
  const queryClient = useQueryClient()

  useEffect(
    function watchDepositUpdates() {
      // Not using useState as 1. this value is local to the effect and
      // 2. to avoid unsubscribing and resubscribing when the state value changes
      let hasWorkedPostedBack = false
      const saveUpdates = function (
        event: MessageEvent<{
          updates: Partial<EvmDepositOperation>
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
          // This is needed to invalidate the balance query when the deposit is done
          // so the balance is updated in the UI instantly
          if (updates.status === EvmDepositStatus.DEPOSIT_RELAYED) {
            const balanceQueryKey = isNativeAddress(deposit.l1Token)
              ? nativeTokenBalanceQueryKey
              : erc20BalanceQueryKey

            queryClient.invalidateQueries({ queryKey: balanceQueryKey })
          }
          updateDeposit(deposit, updates)
        }
      }

      worker.addEventListener('message', saveUpdates)

      // refetch every 15 seconds
      const interval = 15 * 1000

      worker.postMessage({
        deposit,
        type: 'watch-evm-deposit',
      })

      const intervalId = setInterval(function () {
        if (!hasWorkedPostedBack) {
          return
        }
        worker.postMessage({
          deposit,
          type: 'watch-evm-deposit',
        })
        // Block posting until a response is received
        hasWorkedPostedBack = false
      }, interval)

      return function cleanup() {
        worker.removeEventListener('message', saveUpdates)
        clearInterval(intervalId)
      }
    },
    [
      erc20BalanceQueryKey,
      deposit,
      nativeTokenBalanceQueryKey,
      queryClient,
      updateDeposit,
      worker,
    ],
  )

  return null
}

const missingInformation = (deposit: EvmDepositOperation) =>
  !deposit.blockNumber || !deposit.timestamp

// See https://github.com/vercel/next.js/issues/31009#issuecomment-11463441611
// and https://github.com/vercel/next.js/issues/31009#issuecomment-1338645354
const getWorker = () =>
  new Worker(new URL('../../workers/watchEvmDeposits.ts', import.meta.url))

export const EvmDepositsStatusUpdater = function () {
  const { isConnected } = useAccount()

  const deposits = useEvmDeposits()

  const unsupportedChain = useConnectedToUnsupportedEvmChain()

  if (!isConnected || unsupportedChain) {
    return null
  }

  const depositsToWatch = deposits.filter(
    deposit => isPendingOperation(deposit) || missingInformation(deposit),
  )

  return (
    <WithWorker getWorker={getWorker}>
      {(worker: AppToWorker) => (
        <>
          {depositsToWatch.map(deposit => (
            <WatchEvmDeposit
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
