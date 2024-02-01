import { useWithdrawNativeToken } from 'hooks/useOpBridge'
import { useReloadBalances } from 'hooks/useReloadBalances'
import { Token } from 'types/token'
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
  const toWithdraw = parseUnits(fromInput, fromToken.decimals).toString()

  const {
    userWithdrawConfirmationStatus,
    withdrawNativeToken,
    withdrawNativeTokenGasFees,
    withdrawTxHash,
  } = useWithdrawNativeToken(l1ChainId, toWithdraw)

  const { status: withdrawTxStatus } = useWaitForTransaction({
    // @ts-expect-error string is `0x${string}`
    hash: withdrawTxHash,
    onError,
    onSuccess,
  })

  useReloadBalances({
    fromToken,
    status: withdrawTxStatus,
    toToken,
  })

  const handleWithdraw = function () {
    if (canWithdraw) {
      withdrawNativeToken()
    }
  }

  return {
    userWithdrawConfirmationStatus,
    withdraw: handleWithdraw,
    withdrawNativeTokenGasFees,
    withdrawStatus: withdrawTxStatus,
    withdrawTxHash,
  }
}
