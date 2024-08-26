import { useEstimateFees } from 'hooks/useEstimateFees'
import { type EvmToken } from 'types/token'
import { isNativeToken } from 'utils/token'
import { useAccount } from 'wagmi'
import { useAllowance, useApprove } from 'wagmi-erc20-hooks'

import { useChainIsSupported } from './useChainIsSupported'

const ApproveErc20TokenGas = BigInt(45_000)

export const useApproveToken = function (
  token: EvmToken,
  args: Pick<Parameters<typeof useAllowance>['1']['args'], 'spender'> & {
    amount: bigint
  },
) {
  const { amount, spender } = args
  const erc20AddressToken = token.address as `0x${string}`

  const { address: owner, isConnected } = useAccount()
  const isSupported = useChainIsSupported(token.chainId)

  const approvalTokenGasFees = useEstimateFees({
    chainId: token.chainId,
    enabled: isConnected && isSupported,
    gasUnits: ApproveErc20TokenGas,
  })

  const {
    data: allowance = BigInt(0),
    status: allowanceStatus,
    refetch: refetchAllowance,
  } = useAllowance(erc20AddressToken, {
    args: { owner, spender },
    query: {
      enabled: isSupported && !isNativeToken(token) && !!owner && !!spender,
    },
  })

  const needsApproval = amount > allowance && allowanceStatus === 'success'

  const {
    data: hash,
    error: approvalError,
    reset: resetApproval,
    writeContract,
  } = useApprove(erc20AddressToken, {
    args: { amount, spender },
    query: {
      onSuccess: () => refetchAllowance(),
    },
  })

  const approve = function () {
    if (needsApproval) {
      writeContract()
    }
  }

  return {
    approvalError,
    approvalTokenGasFees,
    approvalTxHash: hash,
    approve,
    needsApproval,
    resetApproval,
  }
}
