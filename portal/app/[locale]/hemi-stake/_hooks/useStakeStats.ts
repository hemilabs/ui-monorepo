import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { isValidUrl } from 'utils/url'
import { type Chain } from 'viem'

import { fetchStakeStats, type StakeStats } from '../_fetchers/fetchStakeStats'

const portalApiUrl = import.meta.env.VITE_PORTAL_API_URL

const getStakeStatsQueryKey = (chainId: Chain['id']) => [
  'hemi-stake',
  'stats',
  chainId,
]

export const useStakeStats = function <TData = StakeStats>(
  select?: (data: StakeStats) => TData,
) {
  const chainId = useHemi().id

  return useQuery({
    enabled: portalApiUrl !== undefined && isValidUrl(portalApiUrl),
    queryFn: fetchStakeStats,
    queryKey: getStakeStatsQueryKey(chainId),
    refetchInterval: 1000 * 60 * 5,
    select,
    staleTime: 1000 * 60 * 5,
  })
}
