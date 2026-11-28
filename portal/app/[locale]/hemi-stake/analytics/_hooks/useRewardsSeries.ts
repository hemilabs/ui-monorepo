import { useQuery, useQueryClient } from '@tanstack/react-query'
import { hemi } from 'hemi-viem'
import { hemiTokenMap } from 'hooks/useHemiToken'
import { tokenQueryOptions } from 'hooks/useToken'
import { type EvmToken } from 'types/token'
import { isValidUrl } from 'utils/url'

import { fetchHemiStakeRewards } from '../_fetchers/fetchHemiStakeRewards'
import { toRewardsSeries, type RewardsPeriod } from '../_utils/rewardsHistory'

const portalApiUrl = import.meta.env.VITE_PORTAL_API_URL

export const useRewardsSeries = function (period: RewardsPeriod) {
  const queryClient = useQueryClient()
  return useQuery({
    enabled: portalApiUrl !== undefined && isValidUrl(portalApiUrl),
    queryFn: async () =>
      toRewardsSeries({
        epochs: await fetchHemiStakeRewards(period),
        getToken: ({ address, chainId }) =>
          queryClient.ensureQueryData(
            tokenQueryOptions({ address, chainId }),
          ) as Promise<EvmToken>,
        // Rewards are only hemi mainnet token
        hemiAddress: hemiTokenMap[hemi.id],
        period,
      }),
    queryKey: ['hemi-stake', 'rewards', period],
    refetchInterval: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 5,
  })
}
