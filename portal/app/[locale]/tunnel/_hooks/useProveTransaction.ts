import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUmami } from 'app/analyticsEvents'
import EventEmitter from 'events'
import { proveWithdrawal } from 'hemi-tunnel-actions'
import { ProveEvents } from 'hemi-tunnel-actions/src/types'
import { useNativeTokenBalance } from 'hooks/useBalance'
import { useHemiClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { MessageStatus, ToEvmWithdrawOperation } from 'types/tunnel'
import { useAccount, useWalletClient } from 'wagmi'

type UseProveTransaction = {
  on?: (emitter: EventEmitter<ProveEvents>) => void
  withdrawal: ToEvmWithdrawOperation
}

export const useProveTransaction = function ({
  on,
  withdrawal,
}: UseProveTransaction) {
  const { address: account } = useAccount()
  const { queryKey: nativeTokenBalanceQueryKey } = useNativeTokenBalance(
    withdrawal.l1ChainId,
  )
  const hemiPublicClient = useHemiClient()
  const queryClient = useQueryClient()
  const { updateWithdrawal } = useTunnelHistory()
  const { track } = useUmami()
  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    withdrawal.l1ChainId,
  )
  const { data: l1WalletClient } = useWalletClient()

  return useMutation({
    mutationFn: function prove() {
      const { emitter, promise } = proveWithdrawal({
        account,
        l1WalletClient,
        l2PublicClient: hemiPublicClient,
        withdrawalTransactionHash: withdrawal.transactionHash,
      })

      emitter.on('pre-prove', () => track?.('evm - prove started'))
      emitter.on('user-signed-prove', proveTxHash =>
        updateWithdrawal(withdrawal, { proveTxHash }),
      )
      emitter.on('prove-transaction-reverted', function (receipt) {
        track?.('evm - prove failed')

        updateNativeBalanceAfterFees(receipt)
      })
      emitter.on('prove-transaction-succeeded', function (receipt) {
        updateWithdrawal(withdrawal, {
          proveTxHash: receipt.transactionHash,
          status: MessageStatus.IN_CHALLENGE_PERIOD,
        })

        track?.('evm - prove success')

        updateNativeBalanceAfterFees(receipt)
      })

      on?.(emitter)

      return promise
    },
    onSettled() {
      // Do not return the promises here. Doing so will delay the resolution of
      // the mutation, which will cause the UI to be out of sync until balances are re-validated.
      // Query invalidation here must work as fire and forget, as, after all, it runs in the background!
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })
    },
  })
}
