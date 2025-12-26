import { useMutation, useQueryClient } from '@tanstack/react-query'
import EventEmitter from 'events'
import { type ProveEvents, proveWithdrawal } from 'hemi-tunnel-actions'
import { useNativeTokenBalance } from 'hooks/useBalance'
import { useEnsureConnectedTo } from 'hooks/useEnsureConnectedTo'
import { useHemiClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useUmami } from 'hooks/useUmami'
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
  const ensureConnectedTo = useEnsureConnectedTo()
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
  const { data: l1WalletClient } = useWalletClient({
    chainId: withdrawal.l1ChainId,
  })

  return useMutation({
    mutationFn: async function prove() {
      if (!account) {
        throw new Error('Not Connected')
      }

      await ensureConnectedTo(withdrawal.l1ChainId)

      const { emitter, promise } = proveWithdrawal({
        account,
        l1WalletClient: l1WalletClient!,
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
