import { useEstimateFees } from '@hemilabs/react-hooks/useEstimateFees'
import { EvmToken } from 'types/token'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'
import { Address, encodeFunctionData, erc20Abi } from 'viem'
import { useEstimateGas } from 'wagmi'

export const useEstimateApproveErc20Fees = function ({
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

  const { fees, isError: isFeeError } = useEstimateFees({
    chainId: token.chainId,
    fallbackPriorityFee: getFallbackPriorityFeeForChain(token.chainId),
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })

  return { fees: fees ?? BigInt(0), isError: isFeeError }
}
