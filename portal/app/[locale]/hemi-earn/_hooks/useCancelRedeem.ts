import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type EventEmitter } from 'events'
import { type CancelRedeemEvents } from 'hemi-earn-actions'
import { cancelRedeem } from 'hemi-earn-actions/actions'
import { hemi } from 'hemi-viem'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useAccount } from 'wagmi'

import { earnTransactionsKeyPrefix } from '../_fetchers/fetchEarnTransactions'
import { type EarnTransaction } from '../types'

import { useLocalEarnOperations } from './useLocalEarnOperations'

type UseCancelRedeem = {
  on?: (emitter: EventEmitter<CancelRedeemEvents>) => void
  transaction: EarnTransaction
}

export const useCancelRedeem = function ({ on, transaction }: UseCancelRedeem) {
  const { address } = useAccount()
  const { hemiWalletClient } = useHemiWalletClient()
  const ensureConnectedTo = useEnsureConnectedTo()
  const queryClient = useQueryClient()
  const { setSettlement } = useLocalEarnOperations()
  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    hemi.id,
  )
  const { queryKey: nativeTokenBalanceQueryKey } = useNativeBalance(hemi.id)

  const { requestId } = transaction

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(hemi.id)

      const { emitter, promise } = cancelRedeem({
        account: address,
        requestId: BigInt(requestId),
        walletClient: hemiWalletClient!,
      })

      // Flag the marker failed on any revert/error so the modal returns to its
      // idle state for another try; left pending on success so the row reads as
      // cancelling and the merge drops it once terminal (RECOVERED).
      const fail = () =>
        setSettlement(transaction.requestTxHash, {
          failed: true,
          kind: 'CANCEL',
        })

      emitter.on('user-signed-tx', function (txHash) {
        setSettlement(transaction.requestTxHash, {
          failed: false,
          kind: 'CANCEL',
          txHash,
        })
      })
      emitter.on('tx-transaction-succeeded', function (receipt) {
        updateNativeBalanceAfterFees(receipt)
      })
      emitter.on('tx-transaction-reverted', function (receipt) {
        fail()
        updateNativeBalanceAfterFees(receipt)
      })
      emitter.on('tx-failed', fail)
      emitter.on('tx-failed-validation', fail)
      emitter.on('user-signing-tx-error', fail)
      emitter.on('unexpected-error', fail)

      // Caller listens for `tx-transaction-succeeded` to close the modal — only
      // once the cancel is mined, so a revert keeps it open for another try.
      on?.(emitter)

      return promise
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: earnTransactionsKeyPrefix })
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })
    },
  })
}
