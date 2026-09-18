import { useEstimateFees } from 'hooks/useEstimateFees'
import { getVeHemiEpochRewardsContractAddress } from 've-hemi-epoch-rewards'
import { encodeClaimFrom } from 've-hemi-epoch-rewards/actions'
import { useAccount, useEstimateGas } from 'wagmi'

export const useEstimateCollectAllRewardsFees = function ({
  chainId,
  enabled = true,
  fromEpoch,
  toEpoch,
  tokenId,
}: {
  chainId: number
  enabled?: boolean
  fromEpoch: number | undefined
  toEpoch: number | undefined
  tokenId: bigint | undefined
}) {
  const { address, isConnected } = useAccount()

  const canEstimate =
    !!address &&
    fromEpoch !== undefined &&
    toEpoch !== undefined &&
    tokenId !== undefined

  const data = canEstimate
    ? encodeClaimFrom({
        account: address,
        fromEpoch,
        toEpoch,
        tokenId,
        tokenStart: BigInt(0),
      })
    : undefined

  const { data: gasUnits, isError } = useEstimateGas({
    chainId,
    data,
    query: { enabled: isConnected && enabled && canEstimate },
    to: canEstimate ? getVeHemiEpochRewardsContractAddress(chainId) : undefined,
  })

  return useEstimateFees({
    chainId,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
