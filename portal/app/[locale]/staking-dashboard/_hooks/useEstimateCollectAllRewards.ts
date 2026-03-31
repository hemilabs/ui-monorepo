import { useEstimateFees } from '@hemilabs/react-hooks/useEstimateFees'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'
import { getVeHemiRewardsContractAddress } from 've-hemi-rewards'
import { encodeCollectAllRewards } from 've-hemi-rewards/actions'
import { useAccount, useEstimateGas } from 'wagmi'

export const useEstimateCollectAllRewardsFees = function ({
  chainId,
  enabled = true,
  tokenId,
}: {
  chainId: number
  enabled?: boolean
  tokenId: bigint
}) {
  const { isConnected } = useAccount()
  const veHemiRewardsAddress = getVeHemiRewardsContractAddress(chainId)

  const data = encodeCollectAllRewards({
    addToPositionBPS: BigInt(0),
    tokenId,
  })

  const { data: gasUnits, isError } = useEstimateGas({
    data,
    query: { enabled: isConnected && enabled },
    to: veHemiRewardsAddress,
  })

  const { fees, isError: isFeeError } = useEstimateFees({
    chainId,
    fallbackPriorityFee: getFallbackPriorityFeeForChain(chainId),
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })

  return { fees: fees ?? BigInt(0), isError: isFeeError }
}
