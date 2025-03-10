import { useQuery } from '@tanstack/react-query'
import { featureFlags } from 'app/featureFlags'
import fetch from 'fetch-plus-plus'
import { useAccount } from 'wagmi'

const hemiPointsUrl = process.env.NEXT_PUBLIC_POINTS_URL

export const useHemiPoints = function () {
  const { address, isConnected } = useAccount()

  return useQuery({
    enabled: isConnected && !!address && featureFlags.stakeCampaignEnabled,
    queryFn: () =>
      fetch(`${hemiPointsUrl}/${address}`).then(
        ({ points }) => points,
      ) as Promise<number>,
    queryKey: ['hemi-points', address],
  })
}
