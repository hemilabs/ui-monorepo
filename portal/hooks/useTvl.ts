import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { isValidUrl } from 'utils/url'

const portalApiUrl = process.env.NEXT_PUBLIC_PORTAL_API_URL

export const useTvl = () =>
  useQuery({
    // If the URL is not set, tvl are not returned. Consumers of the hook
    // should consider this scenario
    enabled: portalApiUrl !== undefined && isValidUrl(portalApiUrl),
    queryFn: () => fetch(`${portalApiUrl}/tvl`).then(({ tvl }) => tvl),
    queryKey: ['tvl'],
    // refetch every 60 min
    refetchInterval: 60 * 60 * 1000,
    retry: 2,
  })
