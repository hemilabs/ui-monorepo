import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUmami } from 'app/analyticsEvents'
import EventEmitter from 'events'
import { finalizeWithdrawal } from 'hemi-tunnel-actions'
import { FinalizeEvents } from 'hemi-tunnel-actions/src/types'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useHemiClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { MessageStatus, ToEvmWithdrawOperation } from 'types/tunnel'
import { isNativeAddress } from 'utils/nativeToken'
import { useAccount, useWalletClient } from 'wagmi'

export const useClaimTransaction = function ({
  on,
  withdrawal,
}: {
  on?: (emitter: EventEmitter<FinalizeEvents>) => void
  withdrawal: ToEvmWithdrawOperation
}) {
  const { address: account } = useAccount()
  const hemiClient = useHemiClient()
  const { queryKey: nativeTokenBalanceQueryKey } = useNativeTokenBalance(
    withdrawal.l1ChainId,
  )
  const [networkType] = useNetworkType()
  const queryClient = useQueryClient()
  const { queryKey: erc20BalanceQueryKey } = useTokenBalance(
    withdrawal.l1ChainId,
    withdrawal.l1Token,
  )
  const { updateWithdrawal } = useTunnelHistory()
  const { track } = useUmami()
  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    withdrawal.l1ChainId,
  )
  const { data: l1WalletClient } = useWalletClient()

  const claimingNativeToken = isNativeAddress(withdrawal.l1Token)

  return useMutation({
    mutationFn: function claim() {
      // clear any previous transaction hash, which may come from failed attempts
      updateWithdrawal(withdrawal, { claimTxHash: undefined })

      const { emitter, promise } = finalizeWithdrawal({
        account,
        l1WalletClient,
        l2PublicClient: hemiClient,
        withdrawalTransactionHash: withdrawal.transactionHash,
      })

      emitter.on(
        'pre-finalize',
        () => track?.('evm - claim started', { chain: networkType }),
      )
      emitter.on('user-signed-finalize', claimTxHash =>
        updateWithdrawal(withdrawal, {
          claimTxHash,
        }),
      )
      emitter.on('finalize-transaction-succeeded', function (receipt) {
        updateWithdrawal(withdrawal, {
          status: MessageStatus.RELAYED,
        })

        if (claimingNativeToken) {
          // Use negative, because the balance would be reduced by fees, but incremented by <amount>
          // TODO revert the "-1"
          updateNativeBalanceAfterFees(receipt, -BigInt(withdrawal.amount))
        } else {
          // update native token due to fees
          updateNativeBalanceAfterFees(receipt)

          // the erc20 balance amount gets credited
          queryClient.setQueryData(
            erc20BalanceQueryKey,
            (old: bigint) => old + BigInt(withdrawal.amount),
          )
        }

        track?.('evm - claim success', { chain: networkType })
      })
      emitter.on('finalize-transaction-reverted', function () {
        track?.('evm - claim failed', { chain: networkType })
      })

      on?.(emitter)

      return promise
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })
      if (!claimingNativeToken) {
        queryClient.invalidateQueries({ queryKey: erc20BalanceQueryKey })
      }
    },
  })
}
