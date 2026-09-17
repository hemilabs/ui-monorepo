import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { useHemi } from 'hooks/useHemi'
import {
  isAprSupported,
  isRewardsSeriesConfigured,
} from 'utils/veHemiEpochRewards'

const portalApiUrl = import.meta.env.VITE_PORTAL_API_URL

/**
 * The per-veHEMI rewards series the APR figure is computed from.
 *
 * Not fetched on the epoch generation: the series describes the original contract's
 * continuously accruing pot, and nothing on that generation consumes it. See
 * `isAprSupported`.
 */
export function useRewardsPerVeHEMI() {
  const { id: chainId } = useHemi()

  return useQuery({
    enabled: isAprSupported(chainId) && isRewardsSeriesConfigured(),
    // Not caught into an empty array: an empty series looks like a successful answer,
    // caches for the full staleTime, and is truthy - so the APR query enables on it and
    // then throws on its own length check.
    queryFn: () => fetch(`${portalApiUrl}/ve-hemi-rewards/${chainId}`),
    queryKey: ['rewardsPerVeHEMI', chainId],
    retry: 2,
    staleTime: 1000 * 60 * 60 * 24, // 1 day
  })
}
