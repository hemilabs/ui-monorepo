import { useQueryClient } from '@tanstack/react-query'
import { useUmami } from 'app/analyticsEvents'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useProveMessage } from 'hooks/useL2Bridge'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useCallback, useEffect } from 'react'
import { MessageStatus, ToEvmWithdrawOperation } from 'types/tunnel'
import { useWaitForTransactionReceipt } from 'wagmi'

export const useProveTransaction = function (
  withdrawal: ToEvmWithdrawOperation,
) {
  const connectedToL1 = useIsConnectedToExpectedNetwork(withdrawal.l1ChainId)
  const [networkType] = useNetworkType()
  const queryClient = useQueryClient()
  const { updateWithdrawal } = useTunnelHistory()
  const { track } = useUmami()

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

      track?.('evm - prove success', { chain: networkType })
    },
    [
      clearProveWithdrawalState,
      networkType,
      track,
      updateWithdrawal,
      withdrawal,
      withdrawalProofReceipt,
    ],
  )

  useEffect(
    function trackOnProveFailure() {
      if (withdrawalProofReceiptError) {
        track?.('evm - prove failed', { chain: networkType })
      }
    },
    [withdrawalProofReceiptError, networkType, track],
  )

  const handleProveWithdrawal = function () {
    if (!isReadyToProve) {
      return
    }
    // clear any previous transaction hash, which may come from failed attempts
    updateWithdrawal(withdrawal, { proveTxHash: undefined })
    proveWithdrawal()
    track?.('evm - prove started', { chain: networkType })
  }

  return {
    isReadyToProve,
    proveWithdrawal: handleProveWithdrawal,
    withdrawalProofReceipt,
    withdrawalProofReceiptError,
    ...rest,
  }
}
