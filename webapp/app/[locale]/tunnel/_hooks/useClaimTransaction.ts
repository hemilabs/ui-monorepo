import { MessageStatus } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useFinalizeMessage } from 'hooks/useL2Bridge'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useCallback, useEffect } from 'react'
import { ToEvmWithdrawOperation } from 'types/tunnel'
import { useWaitForTransactionReceipt } from 'wagmi'

export const useClaimTransaction = function (
  withdrawal: ToEvmWithdrawOperation,
) {
  const connectedToL1 = useIsConnectedToExpectedNetwork(withdrawal.l1ChainId)
  const queryClient = useQueryClient()
  const { updateWithdrawal } = useTunnelHistory()

  const isReadyToClaim =
    withdrawal.status === MessageStatus.READY_FOR_RELAY && connectedToL1

  const {
    finalizeWithdrawal,
    resetFinalizeWithdrawal,
    finalizeWithdrawalTxHash,
    finalizeWithdrawalError,
    finalizeWithdrawalTokenGasFees,
  } = useFinalizeMessage({
    enabled: isReadyToClaim,
    l1ChainId: withdrawal.l1ChainId,
    onSuccess: claimTxHash => updateWithdrawal(withdrawal, { claimTxHash }),
    withdrawTxHash: withdrawal.transactionHash,
  })

  const {
    data: claimWithdrawalReceipt,
    error: claimWithdrawalReceiptError,
    queryKey: finalizeWithdrawalQueryKey,
  } = useWaitForTransactionReceipt({
    hash: finalizeWithdrawalTxHash,
  })

  const handleClaimWithdrawal = function () {
    if (isReadyToClaim) {
      finalizeWithdrawal()
    }
  }

  const clearClaimWithdrawalState = useCallback(
    function () {
      // clear the claim operation hash
      resetFinalizeWithdrawal()
      // clear claim receipt state
      queryClient.removeQueries({ queryKey: finalizeWithdrawalQueryKey })
    },
    [finalizeWithdrawalQueryKey, queryClient, resetFinalizeWithdrawal],
  )

  useEffect(
    function updateWithdrawalAfterConfirmation() {
      if (claimWithdrawalReceipt?.status !== 'success') {
        return
      }

      if (withdrawal.status === MessageStatus.RELAYED) {
        return
      }
      updateWithdrawal(withdrawal, {
        claimTxHash: claimWithdrawalReceipt.transactionHash,
        status: MessageStatus.RELAYED,
      })

      clearClaimWithdrawalState()
    },
    [
      claimWithdrawalReceipt,
      clearClaimWithdrawalState,
      updateWithdrawal,
      withdrawal,
    ],
  )

  return {
    claimWithdrawal: handleClaimWithdrawal,
    claimWithdrawalError: finalizeWithdrawalError,
    claimWithdrawalReceipt,
    claimWithdrawalReceiptError,
    claimWithdrawalTokenGasFees: finalizeWithdrawalTokenGasFees,
    claimWithdrawalTxHash: finalizeWithdrawalTxHash,
    clearClaimWithdrawalState,
    isReadyToClaim,
  }
}
