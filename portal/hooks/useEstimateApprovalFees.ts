import { useEstimateTransactionFees } from 'hooks/useEstimateTransactionFees'
import { EvmToken } from 'types/token'
import { Address, encodeFunctionData, erc20Abi } from 'viem'
import { useEstimateGas } from 'wagmi'

export const useEstimateApprovalFees = function ({
  amount,
  enabled = true,
  spender,
  token,
}: {
  amount: bigint
  enabled?: boolean
  spender: Address
  token: EvmToken
}) {
  const { data: gasUnits, isError } = useEstimateGas({
    data: encodeFunctionData({
      abi: erc20Abi,
      args: [spender, amount],
      functionName: 'approve',
    }),
    query: { enabled: enabled && amount > BigInt(0) },
    to: token.address as Address,
  })

  return useEstimateTransactionFees({
    chainId: token.chainId,
    enabled: gasUnits !== undefined,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
