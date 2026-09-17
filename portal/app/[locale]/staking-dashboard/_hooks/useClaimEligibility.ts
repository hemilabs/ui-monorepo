import { useHemi } from 'hooks/useHemi'
import { getRewardsGeneration } from 'utils/veHemiEpochRewards'
import { useAccount } from 'wagmi'

import { claimIneligibility } from '../_utils/claimEligibility'

import { useEpochSystemState } from './useEpochSystemState'
import { useHasRewards } from './useHasRewards'

// Whether this position's rewards can be collected right now, and if not, why. A
// greyed-out button with no explanation reads as a broken one, and several of these
// states are things the holder can act on.
export const useClaimEligibility = function ({
  owner,
  tokenId,
}: {
  owner: string
  tokenId: bigint
}) {
  const { address, chainId: connectedChainId } = useAccount()
  const { id: hemiChainId } = useHemi()
  const { hasRewards, isRewardsUnavailable } = useHasRewards(tokenId)
  const { data: systemState } = useEpochSystemState()

  const reason = claimIneligibility({
    address,
    connectedChainId,
    generation: getRewardsGeneration(hemiChainId),
    hasRewards,
    hemiChainId,
    isRewardsUnavailable,
    owner,
    systemState,
  })

  return { disabled: reason !== undefined, reason }
}
