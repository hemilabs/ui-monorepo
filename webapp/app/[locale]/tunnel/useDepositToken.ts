import { useApproveToken } from 'hooks/useApproveToken'
import { useDepositErc20Token } from 'hooks/useL2Bridge'
import { Token } from 'types/token'
import { parseUnits } from 'viem'
import { usePrepareContractWrite, useWaitForTransaction } from 'wagmi'

const ExtraApprovalTimesAmount = 10

type UseDepositToken = Pick<
  Parameters<typeof usePrepareContractWrite>['0'],
  'enabled'
> & {
  amount: string
  extendedApproval?: boolean
  onApprovalError?: () => void
  onApprovalSuccess?: () => void
  token: Token
}
export const useDepositToken = function ({
  amount,
  enabled,
  extendedApproval = false,
  onApprovalError,
  onApprovalSuccess,
  token,
}: UseDepositToken) {
  const toDeposit = parseUnits(amount, token.decimals).toString()

  const {
    depositErc20Token,
    depositErc20TokenGasFees,
    depositErc20TokenTxHash,
    l1StandardBridgeAddress,
    status: depositStatus,
  } = useDepositErc20Token({
    enabled,
    l1ChainId: token.chainId,
    toDeposit,
    token,
  })

  const {
    approvalTokenGasFees,
    approvalTxHash,
    approve,
    needsApproval,
    userConfirmationApprovalStatus,
  } = useApproveToken(token, {
    amount:
      BigInt(toDeposit) *
      BigInt(extendedApproval ? ExtraApprovalTimesAmount : 1),
    // @ts-expect-error address is `0x${string}`
    spender: l1StandardBridgeAddress,
  })

  const { status: approvalTxStatus } = useWaitForTransaction({
    hash: approvalTxHash,
    onError: onApprovalError,
    onSuccess() {
      onApprovalSuccess?.()
      depositErc20Token()
    },
  })

  const depositToken = function () {
    if (!enabled) {
      return
    }
    if (needsApproval) {
      approve()
    } else {
      depositErc20Token()
    }
  }

  return {
    approvalTokenGasFees,
    approvalTxHash,
    approvalTxStatus,
    depositErc20TokenGasFees,
    depositErc20TokenTxHash,
    depositToken,
    needsApproval,
    status: depositStatus,
    userConfirmationApprovalStatus,
  }
}
