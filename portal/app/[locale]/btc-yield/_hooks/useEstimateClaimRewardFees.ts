import { useEstimateFees } from '@hemilabs/react-hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { encodeClaimAllRewards } from 'merkl-claim-rewards/actions'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'
import { useAccount, useEstimateGas } from 'wagmi'

import {
  MERKL_DISTRIBUTOR_ADDRESS,
  transformMerklRewardsToClaimParams,
} from '../_utils'

import { useMerklRewards } from './useMerklRewards'

export const useEstimateClaimRewardFees = function ({
  enabled = true,
}: {
  enabled?: boolean
} = {}) {
  const hemi = useHemi()
  const { address } = useAccount()
  const { data: merklRewards } = useMerklRewards()

  const claimParams = merklRewards
    ? transformMerklRewardsToClaimParams(merklRewards)
    : null
  const hasClaimableRewards = !!claimParams && claimParams.amounts.length > 0

  const isEnabled = enabled && !!address && hasClaimableRewards

  const { data: gasUnits, isError } = useEstimateGas({
    data: isEnabled ? encodeClaimAllRewards(claimParams) : undefined,
    query: { enabled: isEnabled },
    to: MERKL_DISTRIBUTOR_ADDRESS,
  })

  const { fees, isError: isFeeError } = useEstimateFees({
    chainId: hemi.id,
    fallbackPriorityFee: getFallbackPriorityFeeForChain(hemi.id),
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })

  return { fees: fees ?? BigInt(0), isError: isFeeError }
}
