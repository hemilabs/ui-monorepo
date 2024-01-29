import { useApproveToken } from 'hooks/useApproveToken'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { Token } from 'types/token'
import { parseEther, parseUnits } from 'viem'
import {
  useAccount,
  usePrepareContractWrite,
  usePrepareSendTransaction,
  useSendTransaction,
  useWaitForTransaction,
} from 'wagmi'
import { useTransferFrom } from 'wagmi-erc20-hooks'

type UseDepositNativeToken = Pick<
  Parameters<typeof usePrepareSendTransaction>['0'],
  'enabled'
> & { amount: string; chainId: number }

const ExtraApprovalTimesAmount = 10

// Calculated from Testnet, may need to be reviewed/updated
const DepositNativeTokenGas = 150_000
const DepositErc20TokenGas = 150_000

export const useDepositNativeToken = function ({
  amount,
  chainId,
  ...options
}: UseDepositNativeToken) {
  const depositNativeTokenGasFees = useEstimateFees(
    chainId,
    DepositNativeTokenGas,
  )

  const { config } = usePrepareSendTransaction({
    to: process.env.NEXT_PUBLIC_PROXY_OVM_L1_STANDARD_BRIDGE,
    value: parseEther(amount),
    ...options,
  })
  const { data, sendTransaction, status } = useSendTransaction(config)

  return {
    depositNativeToken: () => sendTransaction?.(),
    depositNativeTokenGasFees,
    depositNativeTokenTxHash: data?.hash,
    status,
  }
}

// TBD spender address
const erc20Spender = process.env
  .NEXT_PUBLIC_PROXY_OVM_L1_STANDARD_BRIDGE as `0x${string}`

type UseDepositToken = Pick<
  Parameters<typeof usePrepareContractWrite>['0'],
  'enabled'
> & { amount: string; extendedApproval?: boolean; token: Token }
export const useDepositToken = function ({
  amount,
  extendedApproval = false,
  token,
  enabled,
}: UseDepositToken) {
  const depositErc20TokenGasFees = useEstimateFees(
    token.chainId,
    DepositErc20TokenGas,
  )
  const { address } = useAccount()

  const amountUnits = parseUnits(amount, token.decimals)

  // TODO set real deposit operation call. For the time being,
  // we are just using the transferFrom call to simulate the deposit
  // See https://github.com/BVM-priv/ui-monorepo/issues/20
  const {
    data: depositTokenTx,
    status: depositStatus,
    write: deposit,
  } = useTransferFrom(token.address as `0x${string}`, {
    args: {
      amount: amountUnits,
      recipient: erc20Spender,
      sender: address,
    },
    query: {
      enabled,
    },
  })

  const {
    approvalTokenGasFees,
    approvalTxHash,
    approve,
    needsApproval,
    userConfirmationApprovalStatus,
  } = useApproveToken(token, {
    amount:
      amountUnits * BigInt(extendedApproval ? ExtraApprovalTimesAmount : 1),
    spender: erc20Spender,
  })

  const { status: approvalTxStatus } = useWaitForTransaction({
    hash: approvalTxHash,
    onSuccess: deposit,
  })

  const depositToken = function () {
    if (needsApproval) {
      approve()
    } else {
      deposit()
    }
  }

  return {
    approvalTokenGasFees,
    approvalTxHash,
    approvalTxStatus,
    depositErc20TokenGasFees,
    depositToken,
    depositTokenTxHash: depositTokenTx?.hash,
    needsApproval,
    status: depositStatus,
    userConfirmationApprovalStatus,
  }
}
