import { useEstimateApproveErc20Fees as useEstimateApproveErc20FeesFromLib } from '@hemilabs/react-hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { encodeFunctionData, erc20Abi } from 'viem'
import { useEstimateGas } from 'wagmi'

type LibParams = Parameters<typeof useEstimateApproveErc20FeesFromLib>[0]

export const useEstimateApproveErc20Fees = function (params: LibParams) {
  const { amount, enabled, spender, token } = params

  const { data: gasUnits, isError } = useEstimateGas({
    chainId: token.chainId,
    data: encodeFunctionData({
      abi: erc20Abi,
      args: [spender, amount],
      functionName: 'approve',
    }),
    query: { enabled: enabled && amount > BigInt(0) },
    to: token.address,
  })

  return useEstimateFees({
    chainId: token.chainId,
    gasUnits,
    isGasUnitsError: isError,
  })
}
