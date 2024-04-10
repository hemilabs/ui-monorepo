import { MessageStatus } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import {
  useL1GetTransactionMessageStatus,
  useFinalizeMessage,
} from 'hooks/useL2Bridge'
import { useCallback } from 'react'
import type { Chain, Hash } from 'viem'
import { useWaitForTransactionReceipt } from 'wagmi'

type UseClaimTransaction = {
  l1ChainId: Chain['id']
  withdrawTxHash: Hash
}

export const useClaimTransaction = function ({
  l1ChainId,
  withdrawTxHash,
}: UseClaimTransaction) {
  const queryClient = useQueryClient()

  const connectedToL1 = useIsConnectedToExpectedNetwork(l1ChainId)

  const transactionMessageStatus = useL1GetTransactionMessageStatus({
    l1ChainId,
    refetchUntilStatus: MessageStatus.READY_FOR_RELAY,
    transactionHash: withdrawTxHash,
  })

  const isReadyToClaim =
    transactionMessageStatus === MessageStatus.READY_FOR_RELAY && connectedToL1

  const {
    finalizeWithdrawal,
    finalizeWithdrawalMutationKey,
    resetFinalizeWithdrawal,
    finalizeWithdrawalTxHash,
    finalizeWithdrawalError,
    finalizeWithdrawalTokenGasFees,
  } = useFinalizeMessage({
    enabled: isReadyToClaim,
    l1ChainId,
    withdrawTxHash,
  })

  const { data: claimWithdrawalReceipt, error: claimWithdrawalReceiptError } =
    useWaitForTransactionReceipt({
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
      queryClient.removeQueries({ queryKey: finalizeWithdrawalMutationKey })
    },
    [finalizeWithdrawalMutationKey, queryClient, resetFinalizeWithdrawal],
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
