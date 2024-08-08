import { MessageStatus } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import {
  useL1GetTransactionMessageStatus,
  useProveMessage,
} from 'hooks/useL2Bridge'
import { useCallback } from 'react'
import type { Chain, Hash } from 'viem'
import { useWaitForTransactionReceipt } from 'wagmi'

type UseProveTransaction = {
  l1ChainId: Chain['id']
  withdrawTxHash: Hash
}

export const useProveTransaction = function ({
  l1ChainId,
  withdrawTxHash,
}: UseProveTransaction) {
  const queryClient = useQueryClient()

  const connectedToL1 = useIsConnectedToExpectedNetwork(l1ChainId)

  const { messageStatus: transactionMessageStatus } =
    useL1GetTransactionMessageStatus({
      l1ChainId,
      refetchUntilStatus: MessageStatus.READY_TO_PROVE,
      transactionHash: withdrawTxHash,
    })

  const isReadyToProve =
    transactionMessageStatus === MessageStatus.READY_TO_PROVE && connectedToL1

  const { proveWithdrawal, resetProveWithdrawal, ...rest } = useProveMessage({
    enabled: isReadyToProve,
    l1ChainId,
    withdrawTxHash,
  })

  const {
    data: withdrawalProofReceipt,
    error: withdrawalProofReceiptError,
    queryKey: withdrawalProofQueryKey,
    status: withdrawalProofTxStatus,
  } = useWaitForTransactionReceipt({
    hash: rest.proveWithdrawalTxHash,
  })

  const handleProveWithdrawal = function () {
    if (isReadyToProve) {
      proveWithdrawal()
    }
  }

  const clearProveWithdrawalState = useCallback(
    function () {
      // clear the prof operation hash
      resetProveWithdrawal()
      // clear proof receipt state
      queryClient.removeQueries({ queryKey: withdrawalProofQueryKey })
    },
    [queryClient, resetProveWithdrawal, withdrawalProofQueryKey],
  )

  return {
    clearProveWithdrawalState,
    isReadyToProve,
    proveWithdrawal: handleProveWithdrawal,
    withdrawalProofReceipt,
    withdrawalProofReceiptError,
    withdrawalProofTxStatus,
    ...rest,
  }
}
