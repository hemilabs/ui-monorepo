import { useQueryClient } from '@tanstack/react-query'
import { useDepositNativeToken } from 'hooks/useL2Bridge'
import { useReloadBalances } from 'hooks/useReloadBalances'
import { useCallback } from 'react'
import { type EvmToken } from 'types/token'
import { isNativeToken } from 'utils/token'
import { parseUnits } from 'viem'
import { useWaitForTransactionReceipt } from 'wagmi'

import { useDepositToken } from './useDepositToken'

type UseDeposit = {
  canDeposit: boolean
  extendedErc20Approval: boolean | undefined
  fromInput: string
  fromToken: EvmToken
  toToken: EvmToken
}
export const useDeposit = function ({
  canDeposit,
  extendedErc20Approval,
  fromInput,
  fromToken,
  toToken,
}: UseDeposit) {
  const queryClient = useQueryClient()
  const depositingNative = isNativeToken(fromToken)

  const toDeposit = parseUnits(fromInput, fromToken.decimals).toString()

  const {
    depositNativeToken,
    depositNativeTokenError,
    depositNativeTokenGasFees,
    depositNativeTokenTxHash,
    resetDepositNativeToken,
  } = useDepositNativeToken({
    enabled: depositingNative && canDeposit,
    l1ChainId: fromToken.chainId,
    toDeposit,
  })

  const {
    approvalError,
    approvalQueryKey,
    approvalReceipt,
    approvalReceiptError,
    approvalTokenGasFees,
    approvalTxHash,
    depositErc20TokenError,
    depositErc20TokenGasFees,
    depositErc20TokenTxHash,
    depositToken,
    needsApproval,
    resetApproval,
    resetDepositToken,
  } = useDepositToken({
    amount: fromInput,
    enabled: !depositingNative && canDeposit,
    extendedApproval: extendedErc20Approval,
    token: fromToken,
  })

  const {
    data: depositReceipt,
    error: depositReceiptError,
    queryKey: depositQueryKey,
    status: depositTxStatus,
  } = useWaitForTransactionReceipt({
    hash: depositingNative ? depositNativeTokenTxHash : depositErc20TokenTxHash,
  })

  useReloadBalances({
    fromToken,
    status: depositTxStatus,
    toToken,
  })

  const handleDeposit = (depositCallback: () => void) =>
    function () {
      if (canDeposit) {
        depositCallback()
      }
    }

  const clearDepositNativeState = useCallback(
    function () {
      // clear the deposit operation hash
      resetDepositNativeToken()
      // clear transaction receipt state
      queryClient.removeQueries({ queryKey: depositQueryKey })
    },
    [depositQueryKey, queryClient, resetDepositNativeToken],
  )

  const clearDepositTokenState = useCallback(
    function () {
      // clear the approval operation hash, if any
      resetApproval?.()
      // clear the deposit operation hash
      resetDepositToken()
      // clear approval receipt state
      queryClient.removeQueries({ queryKey: approvalQueryKey })
      // clear transaction receipt state
      queryClient.removeQueries({ queryKey: depositQueryKey })
    },
    [
      approvalQueryKey,
      depositQueryKey,
      queryClient,
      resetApproval,
      resetDepositToken,
    ],
  )

  if (depositingNative) {
    return {
      clearDepositState: clearDepositNativeState,
      deposit: handleDeposit(depositNativeToken),
      depositError: depositNativeTokenError,
      depositGasFees: depositNativeTokenGasFees,
      depositReceipt,
      depositReceiptError,
      depositTxHash: depositNativeTokenTxHash,
      needsApproval: false,
    }
  }

  return {
    approvalError,
    approvalReceipt,
    approvalReceiptError,
    approvalTokenGasFees,
    approvalTxHash,
    clearDepositState: clearDepositTokenState,
    deposit: handleDeposit(depositToken),
    depositError: depositErc20TokenError,
    depositGasFees: depositErc20TokenGasFees,
    depositReceipt,
    depositReceiptError,
    depositTxHash: depositErc20TokenTxHash,
    needsApproval,
  }
}
