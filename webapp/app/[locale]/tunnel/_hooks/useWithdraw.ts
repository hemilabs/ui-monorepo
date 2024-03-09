import { useQueryClient } from '@tanstack/react-query'
import { useWithdrawNativeToken, useWithdrawToken } from 'hooks/useL2Bridge'
import { useReloadBalances } from 'hooks/useReloadBalances'
import { useCallback } from 'react'
import { Token } from 'types/token'
import { isNativeToken } from 'utils/token'
import { type Chain, parseUnits } from 'viem'
import { useWaitForTransactionReceipt } from 'wagmi'

type UseWithdraw = {
  canWithdraw: boolean
  fromInput: string
  fromToken: Token
  l1ChainId: Chain['id']
  toToken: Token
}
export const useWithdraw = function ({
  canWithdraw,
  fromInput,
  fromToken,
  l1ChainId,
  toToken,
}: UseWithdraw) {
  const queryClient = useQueryClient()
  const withdrawingNative = isNativeToken(fromToken)

  const toWithdraw = parseUnits(fromInput, fromToken.decimals).toString()

  const {
    resetWithdrawNativeToken,
    withdrawNativeTokenMutationKey,
    withdrawNativeToken,
    withdrawNativeTokenError,
    withdrawNativeTokenGasFees,
    withdrawTxHash,
  } = useWithdrawNativeToken({
    amount: toWithdraw,
    enabled: withdrawingNative && canWithdraw,
    l1ChainId,
  })

  const {
    resetWithdrawErc20Token,
    withdrawErc20TokenError,
    withdrawErc20TokenGasFees,
    withdrawErc20TokenMutationKey,
    withdrawErc20Token,
    withdrawErc20TokenTxHash,
  } = useWithdrawToken({
    amount: toWithdraw,
    enabled: !withdrawingNative && canWithdraw,
    l1ChainId,
    token: fromToken,
  })

  const {
    data: withdrawReceipt,
    error: withdrawReceiptError,
    status: withdrawTxStatus,
  } = useWaitForTransactionReceipt({
    // @ts-expect-error string is `0x${string}`
    hash: withdrawingNative ? withdrawTxHash : withdrawErc20TokenTxHash,
  })
  useReloadBalances({
    fromToken,
    status: withdrawTxStatus,
    toToken,
  })

  const handleWithdraw = (withdrawCallback: () => void) =>
    function () {
      if (canWithdraw) {
        withdrawCallback()
      }
    }

  const clearWithdrawNativeState = useCallback(
    function () {
      // clear the withdrawal operation hash
      resetWithdrawNativeToken()
      // clear withdrawal receipt state
      queryClient.removeQueries({ queryKey: withdrawNativeTokenMutationKey })
    },
    [queryClient, resetWithdrawNativeToken, withdrawNativeTokenMutationKey],
  )

  const clearWithdrawErc20TokenState = useCallback(
    function () {
      // clear the withdrawal operation hash
      resetWithdrawErc20Token()
      // clear withdrawal receipt state
      queryClient.removeQueries({ queryKey: withdrawErc20TokenMutationKey })
    },
    [queryClient, resetWithdrawErc20Token, withdrawErc20TokenMutationKey],
  )

  if (withdrawingNative) {
    return {
      clearWithdrawState: clearWithdrawNativeState,
      withdraw: handleWithdraw(withdrawNativeToken),
      withdrawError: withdrawNativeTokenError,
      withdrawGasFees: withdrawNativeTokenGasFees,
      withdrawReceipt,
      withdrawReceiptError,
      withdrawStatus: withdrawTxStatus,
      withdrawTxHash,
    }
  }
  return {
    clearWithdrawState: clearWithdrawErc20TokenState,
    withdraw: handleWithdraw(withdrawErc20Token),
    withdrawError: withdrawErc20TokenError,
    withdrawGasFees: withdrawErc20TokenGasFees,
    withdrawReceipt,
    withdrawReceiptError,
    withdrawStatus: withdrawTxStatus,
    withdrawTxHash: withdrawErc20TokenTxHash,
  }
}
