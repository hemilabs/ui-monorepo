import { useEstimateFees } from 'hooks/useEstimateFees'
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

  const { data: gasUnits } = useEstimateGas({
    data,
    query: { enabled: isConnected && enabled },
    to: veHemiRewardsAddress,
  })

  return useEstimateFees({
    chainId,
    enabled: gasUnits !== undefined,
    gasUnits,
    overEstimation: 1.5,
  })
}
