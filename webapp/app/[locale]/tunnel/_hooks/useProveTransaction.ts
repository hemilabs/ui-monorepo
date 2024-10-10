import { MessageStatus } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useProveMessage } from 'hooks/useL2Bridge'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useCallback, useEffect } from 'react'
import { ToEvmWithdrawOperation } from 'types/tunnel'
import { useWaitForTransactionReceipt } from 'wagmi'

export const useProveTransaction = function (
  withdrawal: ToEvmWithdrawOperation,
) {
  const connectedToL1 = useIsConnectedToExpectedNetwork(withdrawal.l1ChainId)
  const queryClient = useQueryClient()
  const { updateWithdrawal } = useTunnelHistory()

  const isReadyToProve =
    withdrawal.status === MessageStatus.READY_TO_PROVE && connectedToL1

  const { proveWithdrawal, resetProveWithdrawal, ...rest } = useProveMessage({
    enabled: isReadyToProve,
    l1ChainId: withdrawal.l1ChainId,
    onSuccess: proveTxHash => updateWithdrawal(withdrawal, { proveTxHash }),
    withdrawTxHash: withdrawal.transactionHash,
  })

  const {
    data: withdrawalProofReceipt,
    error: withdrawalProofReceiptError,
    queryKey: withdrawalProofQueryKey,
  } = useWaitForTransactionReceipt({
    hash: rest.proveWithdrawalTxHash,
  })

  const clearProveWithdrawalState = useCallback(
    function () {
      // clear the prof operation hash
      resetProveWithdrawal()
      // clear proof receipt state
      queryClient.removeQueries({ queryKey: withdrawalProofQueryKey })
    },
    [queryClient, resetProveWithdrawal, withdrawalProofQueryKey],
  )

  useEffect(
    function updateWithdrawalAfterProveConfirmation() {
      if (withdrawalProofReceipt?.status !== 'success') {
        return
      }
      if (withdrawal?.status === MessageStatus.IN_CHALLENGE_PERIOD) {
        return
      }

      updateWithdrawal(withdrawal, {
        proveTxHash: withdrawalProofReceipt.transactionHash,
        status: MessageStatus.IN_CHALLENGE_PERIOD,
      })

      clearProveWithdrawalState()
    },
    [
      clearProveWithdrawalState,
      updateWithdrawal,
      withdrawal,
      withdrawalProofReceipt,
    ],
  )

  const handleProveWithdrawal = function () {
    if (!isReadyToProve) {
      return
    }
    // clear any previous transaction hash, which may come from failed attempts
    updateWithdrawal(withdrawal, { proveTxHash: undefined })
    proveWithdrawal()
  }

  return {
    isReadyToProve,
    proveWithdrawal: handleProveWithdrawal,
    withdrawalProofReceipt,
    withdrawalProofReceiptError,
    ...rest,
  }
}
