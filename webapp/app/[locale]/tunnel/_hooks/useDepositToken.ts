import { useQueryClient } from '@tanstack/react-query'
import { useApproveToken } from 'hooks/useApproveToken'
import { useDepositErc20Token } from 'hooks/useL2Bridge'
import { useEffect } from 'react'
import { type EvmToken } from 'types/token'
import { parseUnits } from 'viem'
import {
  useAccount,
  useSimulateContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { useAllowance } from 'wagmi-erc20-hooks'

const ExtraApprovalTimesAmount = 10

type UseDepositToken = Pick<
  Parameters<typeof useSimulateContract>['0'],
  'enabled'
> & {
  amount: string
  extendedApproval?: boolean
  token: EvmToken
}
export const useDepositToken = function ({
  amount,
  enabled,
  extendedApproval = false,
  token,
}: UseDepositToken) {
  const toDeposit = parseUnits(amount, token.decimals).toString()
  const queryClient = useQueryClient()

  const { address: owner } = useAccount()

  const {
    depositErc20Token,
    depositErc20TokenError,
    depositErc20TokenGasFees,
    depositErc20TokenTxHash,
    l1StandardBridgeAddress,
    resetDepositToken,
    status: depositStatus,
  } = useDepositErc20Token({
    enabled,
    l1ChainId: token.chainId,
    toDeposit,
    token,
  })

  const { data: depositReceipt, error: depositReceiptError } =
    useWaitForTransactionReceipt({
      hash: depositErc20TokenTxHash,
    })

  // @ts-expect-error string is `0x${string}`
  const { queryKey } = useAllowance(token.address, {
    args: {
      owner,
      spender: l1StandardBridgeAddress,
    },
  })

  const depositReceiptStatus = depositReceipt?.status
  useEffect(
    function invalidateAllowance() {
      if (depositReceiptStatus === 'success' || depositReceiptError) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
    [depositReceiptError, depositReceiptStatus, queryClient, queryKey],
  )

  const {
    approvalError,
    approvalTokenGasFees,
    approvalTxHash,
    approve,
    needsApproval,
    resetApproval,
  } = useApproveToken(token, {
    amount:
      BigInt(toDeposit) *
      BigInt(extendedApproval ? ExtraApprovalTimesAmount : 1),
    spender: l1StandardBridgeAddress,
  })

  const {
    data: approvalReceipt,
    error: approvalReceiptError,
    queryKey: approvalQueryKey,
  } = useWaitForTransactionReceipt({
    hash: approvalTxHash,
  })

  const approvalReceiptStatus = approvalReceipt?.status
  useEffect(
    function depositAfterApprovalSuccess() {
      if (approvalReceiptStatus === 'success' && depositStatus === 'idle') {
        depositErc20Token()
      }
    },
    [approvalReceiptStatus, depositErc20Token, depositStatus],
  )

  const depositToken = function () {
    if (!enabled) {
      return undefined
    }
    if (needsApproval) {
      approve()
    } else {
      depositErc20Token()
    }
    return undefined
  }

  return {
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
  }
}
