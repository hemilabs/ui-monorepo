import { MessageStatus } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useUmami } from 'app/analyticsEvents'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useFinalizeMessage } from 'hooks/useL2Bridge'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useCallback, useEffect } from 'react'
import { ToEvmWithdrawOperation } from 'types/tunnel'
import { isNativeAddress } from 'utils/nativeToken'
import { useWaitForTransactionReceipt } from 'wagmi'

export const useClaimTransaction = function (
  withdrawal: ToEvmWithdrawOperation,
) {
  const connectedToL1 = useIsConnectedToExpectedNetwork(withdrawal.l1ChainId)

  const { queryKey: erc20BalanceQueryKey } = useTokenBalance(
    withdrawal.l1ChainId,
    withdrawal.l1Token,
  )
  const { queryKey: nativeTokenBalanceQueryKey } = useNativeTokenBalance(
    withdrawal.l1ChainId,
  )
  const [networkType] = useNetworkType()
  const queryClient = useQueryClient()
  const { updateWithdrawal } = useTunnelHistory()
  const { track } = useUmami()

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
    if (!isReadyToClaim) {
      return
    }
    // clear any previous transaction hash, which may come from failed attempts
    updateWithdrawal(withdrawal, { claimTxHash: undefined })
    finalizeWithdrawal()
    track?.('evm - claim started', { chain: networkType })
  }

  const invalidateBalanceQuery = useCallback(
    function invalidateQuery() {
      const balanceQueryKey = isNativeAddress(withdrawal.l1Token)
        ? nativeTokenBalanceQueryKey
        : erc20BalanceQueryKey

      queryClient.invalidateQueries({ queryKey: balanceQueryKey })
    },
    [
      nativeTokenBalanceQueryKey,
      erc20BalanceQueryKey,
      queryClient,
      withdrawal.l1Token,
    ],
  )

  const clearClaimWithdrawalState = useCallback(
    function () {
      // clear the claim operation hash
      resetFinalizeWithdrawal()
      // invalidate the balance query
      invalidateBalanceQuery()
      // clear claim receipt state
      queryClient.removeQueries({ queryKey: finalizeWithdrawalQueryKey })
    },
    [
      finalizeWithdrawalQueryKey,
      invalidateBalanceQuery,
      queryClient,
      resetFinalizeWithdrawal,
    ],
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

      track?.('evm - claim success', { chain: networkType })
    },
    [
      claimWithdrawalReceipt,
      clearClaimWithdrawalState,
      networkType,
      track,
      updateWithdrawal,
      withdrawal,
    ],
  )

  useEffect(
    function trackOnClaimFailure() {
      if (claimWithdrawalReceiptError) {
        track?.('evm - claim failed', { chain: networkType })
      }
    },
    [claimWithdrawalReceiptError, networkType, track],
  )

  return {
    claimWithdrawal: handleClaimWithdrawal,
    claimWithdrawalError: finalizeWithdrawalError,
    claimWithdrawalReceipt,
    claimWithdrawalReceiptError,
    claimWithdrawalTokenGasFees: finalizeWithdrawalTokenGasFees,
    isReadyToClaim,
  }
}
