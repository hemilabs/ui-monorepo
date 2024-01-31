import { useReloadBalances } from 'hooks/useReloadBalances'
import { Token } from 'types/token'
import { isNativeToken } from 'utils/token'
import { useWaitForTransaction } from 'wagmi'

import { useDepositNativeToken, useDepositToken } from './useBridgeToken'

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

  const {
    depositNativeTokenGasFees,
    depositNativeToken,
    depositNativeTokenTxHash,
    status: nativeTokenDepositUserConfirmationStatus,
  } = useDepositNativeToken({
    amount: fromInput,
    chainId: fromToken.chainId,
    enabled: depositingNative && canDeposit,
  })

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
    hash: depositingNative ? depositNativeTokenTxHash : depositTokenTxHash,
    onError: onDepositError,
    onSuccess: onDepositSuccess,
  })

  useReloadBalances({
    fromToken,
    status: depositTxStatus,
    toToken,
  })

  if (depositingNative) {
    return {
      deposit: depositNativeToken,
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
    deposit: depositToken,
    depositGasFees: depositErc20TokenGasFees,
    depositStatus: depositTxStatus,
    depositTxHash: depositTokenTxHash,
    needsApproval,
    userConfirmationApprovalStatus,
    userDepositConfirmation: erc20DepositUserConfirmationStatus,
  }
}
