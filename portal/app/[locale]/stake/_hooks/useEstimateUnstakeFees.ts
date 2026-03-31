import { useEstimateFees } from '@hemilabs/react-hooks/useEstimateFees'
import { encodeUnstake, stakeManagerAddresses } from 'hemi-viem-stake-actions'
import { StakeToken } from 'types/stake'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'
import { useEstimateGas } from 'wagmi'

export const useEstimateUnstakeFees = function ({
  amount,
  enabled = true,
  token,
}: {
  amount: bigint
  enabled?: boolean
  token: StakeToken
}) {
  const bridgeAddress = stakeManagerAddresses[token.chainId]

  const { data: gasUnits, isError } = useEstimateGas({
    data: encodeUnstake({
      amount,
      tokenAddress: token.address as `0x${string}`,
    }),
    query: { enabled },
    to: bridgeAddress,
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
