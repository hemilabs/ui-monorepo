import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import {
  getEpochRewardsAddress,
  getEpochRewardsLensAddress,
  getRewardsGeneration,
} from 'utils/veHemiEpochRewards'
import { getBoundRewards, getSystemState } from 've-hemi-rewards/actions'

// Exported when F5 needs to invalidate it after a claim.
const getEpochSystemStateQueryKey = (chainId: number) => [
  'epochSystemState',
  chainId,
]

/**
 * The epoch grid, the token registry and the pause state: one Lens call that the rest of
 * the epoch reads are bounded by. Disabled on chains still using the original contract.
 */
export const useEpochSystemState = function () {
  const { id: chainId } = useHemi()
  // The public client, not the wallet's: reads need no signer, and this is the transport
  // with request batching and the per-block cache on it.
  const hemiClient = useHemiClient()
  const lensAddress = getEpochRewardsLensAddress(chainId)
  const rewardsAddress = getEpochRewardsAddress(chainId)

  return useQuery({
    // Gated on the generation, not just on the Lens address: a chain with only the Lens
    // set resolves to `continuous`, and polling epoch reads there is wasted work.
    enabled:
      !!lensAddress &&
      !!rewardsAddress &&
      getRewardsGeneration(chainId) === 'epoch',
    async queryFn() {
      // Both addresses are pasted by hand and a redeploy issues new ones for each.
      // Half-updating them doesn't fail - the mismatched Lens answers plausibly off the
      // wrong epoch grid while writes go to the right contract. The Lens names its own
      // rewards contract, so one read settles it.
      const [state, boundRewards] = await Promise.all([
        getSystemState(hemiClient, { lensAddress: lensAddress! }),
        getBoundRewards(hemiClient, { lensAddress: lensAddress! }),
      ])

      if (boundRewards.toLowerCase() !== rewardsAddress!.toLowerCase()) {
        throw new Error(
          `The configured Lens reads ${boundRewards}, not the configured rewards contract ${rewardsAddress}. Check VITE_VE_HEMI_EPOCH_REWARDS and VITE_VE_HEMI_EPOCH_REWARDS_LENS - they must come from the same deployment.`,
        )
      }

      return state
    },
    queryKey: getEpochSystemStateQueryKey(chainId),
    // `paused` gates the claim button and can flip at any moment, so this is polled even
    // though the epoch counters only move every ~6 days. It is one cheap call.
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  })
}
