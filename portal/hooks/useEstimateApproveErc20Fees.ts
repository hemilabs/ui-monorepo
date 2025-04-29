import { useEstimateFees } from 'hooks/useEstimateFees'
import { EvmToken } from 'types/token'
import { Address, erc20Abi } from 'viem'
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
  const { data: gasUnits, isSuccess } = useEstimateGas({
    abi: erc20Abi,
    address: token.address,
    args: [spender, amount],
    functionName: 'approve',
    query: { enabled },
  })

  return useEstimateFees({
    chainId: token.chainId,
    enabled: isSuccess,
    gasUnits,
    overEstimation: 1.5,
  })
}
