import { useDepositNativeToken } from 'hooks/useOpBridge'
import { useReloadBalances } from 'hooks/useReloadBalances'
import { Token } from 'types/token'
import { isNativeToken } from 'utils/token'
import { parseUnits } from 'viem'
import { useWaitForTransaction } from 'wagmi'

import { useDepositToken } from './useBridgeToken'

type UseDeposit = {
  canDeposit: boolean
  extendedErc20Approval: boolean | undefined
  fromInput: string
  fromToken: Token
  onApprovalError?: () => void
  onApprovalSuccess?: () => void
  onDepositError?: () => void
  onDepositSuccess?: () => void
  toToken: Token
}
export const useDeposit = function ({
  canDeposit,
  extendedErc20Approval,
  fromInput,
  fromToken,
  onApprovalError,
  onApprovalSuccess,
  onDepositError,
  onDepositSuccess,
  toToken,
}: UseDeposit) {
  const depositingNative = isNativeToken(fromToken)

  const toDeposit = parseUnits(fromInput, fromToken.decimals).toString()

  const {
    depositNativeTokenGasFees,
    depositNativeToken,
    depositNativeTokenTxHash,
    status: nativeTokenDepositUserConfirmationStatus,
  } = useDepositNativeToken(fromToken.chainId, toDeposit)

  const {
    approvalTxHash,
    approvalTokenGasFees,
    approvalTxStatus: approvalStatus,
    depositErc20TokenGasFees,
    depositToken,
    depositTokenTxHash,
    needsApproval,
    status: erc20DepositUserConfirmationStatus,
    userConfirmationApprovalStatus,
  } = useDepositToken({
    amount: fromInput,
    enabled: !depositingNative && canDeposit,
    extendedApproval: extendedErc20Approval,
    onApprovalError,
    onApprovalSuccess,
    token: fromToken,
  })

  const { status: depositTxStatus } = useWaitForTransaction({
    // @ts-expect-error string is `0x${string}`
    hash: depositingNative ? depositNativeTokenTxHash : depositTokenTxHash,
    onError: onDepositError,
    onSuccess: onDepositSuccess,
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

  if (depositingNative) {
    return {
      deposit: handleDeposit(depositNativeToken),
      depositGasFees: depositNativeTokenGasFees,
      depositStatus: depositTxStatus,
      depositTxHash: depositNativeTokenTxHash,
      needsApproval: false,
      userDepositConfirmation: nativeTokenDepositUserConfirmationStatus,
    }
  }

  return {
    approvalStatus,
    approvalTokenGasFees,
    approvalTxHash,
    deposit: handleDeposit(depositToken),
    depositGasFees: depositErc20TokenGasFees,
    depositStatus: depositTxStatus,
    depositTxHash: depositTokenTxHash,
    needsApproval,
    userConfirmationApprovalStatus,
    userDepositConfirmation: erc20DepositUserConfirmationStatus,
  }
}
