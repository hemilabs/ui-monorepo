import { useEstimateFees } from 'hooks/useEstimateFees'
import { EvmToken } from 'types/token'
import { Address, encodeFunctionData, erc20Abi } from 'viem'
import { useEstimateGas } from 'wagmi'

// Not using @hemilabs/react-hooks's useEstimateApproveErc20Fees because it
// internally uses @hemilabs/react-hooks's useEstimateFees.
// The portal instead uses its own useEstimateFees (portal/hooks/useEstimateFees.ts),
// which applies a custom fallbackPriorityFee per chain.

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

  return useEstimateFees({
    chainId: token.chainId,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
