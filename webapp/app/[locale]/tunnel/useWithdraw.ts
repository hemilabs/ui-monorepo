import { useWithdrawNativeToken, useWithdrawToken } from 'hooks/useL2Bridge'
import { useReloadBalances } from 'hooks/useReloadBalances'
import { Token } from 'types/token'
import { isNativeToken } from 'utils/token'
import { parseUnits } from 'viem'
import { type Chain, useWaitForTransaction } from 'wagmi'

type UseWithdraw = {
  canWithdraw: boolean
  fromInput: string
  fromToken: Token
  l1ChainId: Chain['id']
  onSuccess?: () => void
  onError?: () => void
  toToken: Token
}
export const useWithdraw = function ({
  canWithdraw,
  fromInput,
  fromToken,
  l1ChainId,
  onError,
  onSuccess,
  toToken,
}: UseWithdraw) {
  const withdrawingNative = isNativeToken(fromToken)

  const toWithdraw = parseUnits(fromInput, fromToken.decimals).toString()

  const {
    userWithdrawNativeTokenConfirmationStatus,
    withdrawNativeToken,
    withdrawNativeTokenGasFees,
    withdrawTxHash,
  } = useWithdrawNativeToken({
    amount: toWithdraw,
    enabled: withdrawingNative && canWithdraw,
    l1ChainId,
  })

  const {
    userWithdrawTokenConfirmationStatus,
    withdrawErc20TokenGasFees,
    withdrawErc20Token,
    withdrawErc20TokenTxHash,
  } = useWithdrawToken({
    amount: toWithdraw,
    enabled: !withdrawingNative && canWithdraw,
    l1ChainId,
    token: fromToken,
  })

  const { status: withdrawTxStatus } = useWaitForTransaction({
    // @ts-expect-error string is `0x${string}`
    hash: withdrawingNative ? withdrawTxHash : withdrawErc20TokenTxHash,
    onError,
    onSuccess,
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

  if (withdrawingNative) {
    return {
      userWithdrawConfirmationStatus: userWithdrawNativeTokenConfirmationStatus,
      withdraw: handleWithdraw(withdrawNativeToken),
      withdrawGasFees: withdrawNativeTokenGasFees,
      withdrawStatus: withdrawTxStatus,
      withdrawTxHash,
    }
  }
  return {
    userWithdrawConfirmationStatus: userWithdrawTokenConfirmationStatus,
    withdraw: handleWithdraw(withdrawErc20Token),
    withdrawGasFees: withdrawErc20TokenGasFees,
    withdrawStatus: withdrawTxStatus,
    withdrawTxHash: withdrawErc20TokenTxHash,
  }
}
