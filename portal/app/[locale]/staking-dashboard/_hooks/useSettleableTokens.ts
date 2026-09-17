import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import {
  getEpochRewardsAddress,
  getEpochRewardsLensAddress,
  getRewardsGeneration,
} from 'utils/veHemiEpochRewards'
import { getSettleableTokens } from 've-hemi-rewards/actions'
import { useAccount } from 'wagmi'

import { useEpochSystemState } from './useEpochSystemState'

/**
 * Which reward assets this position can settle without reverting.
 *
 * The whole-registry claim reverts as a whole, so one asset refusing its transfer takes
 * every other asset down with it. This says which are still reachable one at a time.
 *
 * Not run for the whole table: it costs a simulation per registered asset, and only
 * matters once a claim has actually failed.
 */
export const useSettleableTokens = function ({
  enabled,
  tokenId,
}: {
  enabled: boolean
  tokenId: bigint
}) {
  const { address } = useAccount()
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const lensAddress = getEpochRewardsLensAddress(chainId)
  const rewardsAddress = getEpochRewardsAddress(chainId)
  const { data: systemState } = useEpochSystemState()

  return useQuery({
    enabled:
      enabled &&
      !!address &&
      !!lensAddress &&
      !!rewardsAddress &&
      !!systemState &&
      getRewardsGeneration(chainId) === 'epoch',
    queryFn: () =>
      getSettleableTokens(hemiClient, {
        fromEpoch: systemState!.firstFundableEpoch,
        holder: address!,
        lensAddress: lensAddress!,
        maxClaimEpochs: Number(systemState!.maxClaimEpochs),
        paused: systemState!.paused,
        rewardsAddress: rewardsAddress!,
        toEpoch: systemState!.settledEpoch,
        tokenId,
        tokens: systemState!.tokens,
      }),
    queryKey: [
      'epochSettleableTokens',
      chainId,
      tokenId.toString(),
      address,
      systemState?.settledEpoch,
      // A pause changes every answer at once, so it is a different query.
      systemState?.paused,
    ],
    // A blocklist can be lifted, and this only mounts on a failure someone is looking
    // at, so re-ask rather than remember across visits.
    staleTime: 30 * 1000,
  })
}
