import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { getRewardsGeneration } from 'utils/veHemiEpochRewards'
import { getRewardTokens } from 've-hemi-rewards/actions'
import { Chain } from 'viem'

import { useEpochSystemState } from './useEpochSystemState'

const getRewardTokensQueryKey = ({ chainId }: { chainId: Chain['id'] }) => [
  'rewardTokens',
  chainId,
]

export const useRewardTokensAddresses = function ({
  enabled = true,
}: {
  enabled?: boolean
} = {}) {
  const { hemiWalletClient } = useHemiWalletClient()
  const { id } = useHemi()
  const isEpochGeneration = getRewardsGeneration(id) === 'epoch'
  const epochSystemState = useEpochSystemState()

  const legacy = useQuery({
    enabled: enabled && !isEpochGeneration && !!hemiWalletClient,
    queryFn: () => getRewardTokens(hemiWalletClient!),
    queryKey: getRewardTokensQueryKey({ chainId: id }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // On the epoch generation the registry is already part of the Lens system state, so
  // there is no second call to make for it.
  return isEpochGeneration
    ? { data: epochSystemState.data?.tokens, status: epochSystemState.status }
    : { data: legacy.data, status: legacy.status }
}
