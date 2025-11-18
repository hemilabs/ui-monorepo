import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { useHemi } from 'hooks/useHemi'
import { isValidUrl } from 'utils/url'

const portalApiUrl = process.env.NEXT_PUBLIC_PORTAL_API_URL

export function useRewardsPerVeHEMI() {
  const { id: chainId } = useHemi()

  return useQuery({
    enabled: portalApiUrl !== undefined && isValidUrl(portalApiUrl),
    async queryFn() {
      const rewards = await fetch(
        `${portalApiUrl}/ve-hemi-rewards/${chainId}`,
      ).catch(() => [])

      return rewards
    },
    queryKey: ['rewardsPerVeHEMI', chainId],
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
