import { useEstimateFees } from 'hooks/useEstimateFees'
import { Token } from 'types/token'
import { isNativeToken } from 'utils/token'
import { useAccount } from 'wagmi'
import { useAllowance, useApprove } from 'wagmi-erc20-hooks'

const ApproveErc20TokenGas = 45_000

export const useApproveToken = function (
  token: Token,
  args: Pick<Parameters<typeof useAllowance>['1']['args'], 'spender'> & {
    amount: bigint
  },
) {
  const { amount, spender } = args
  const erc20AddressToken = token.address as `0x${string}`

  const { address: owner } = useAccount()
  const approvalTokenGasFees = useEstimateFees(
    token.chainId,
    ApproveErc20TokenGas,
  )

  const {
    data: allowance = BigInt(0),
    status: allowanceStatus,
    refetch: refetchAllowance,
  } = useAllowance(erc20AddressToken, {
    args: { owner, spender },
    query: {
      enabled: !isNativeToken(token) && !!owner && !!spender,
      watch: true,
    },
  })
  const needsApproval = amount > allowance && allowanceStatus === 'success'

  const {
    data,
    status: userConfirmationApprovalStatus,
    write: approve,
  } = useApprove(erc20AddressToken, {
    args: { amount, spender },
    query: {
      enabled: needsApproval,
      onSuccess: () => refetchAllowance(),
    },
  })

  return {
    approvalTokenGasFees,
    approvalTxHash: data?.hash,
    approve,
    needsApproval,
    userConfirmationApprovalStatus,
  }
}
