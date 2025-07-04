import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { useAccount } from 'wagmi'

const portalApiUrl = process.env.NEXT_PUBLIC_PORTAL_API_URL

export const useHemiPoints = function () {
  const { address, isConnected } = useAccount()

  return useQuery({
    enabled: isConnected && !!address,
    queryFn: () =>
      fetch(`${portalApiUrl}/points/${address}`).then(
        ({ points }) => points,
      ) as Promise<number>,
    queryKey: ['hemi-points', address],
  })
}
