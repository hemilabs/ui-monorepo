import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { useAccount } from 'wagmi'

const hemiPointsUrl = process.env.NEXT_PUBLIC_POINTS_URL

export const useHemiPoints = function () {
  const { address, isConnected } = useAccount()

  return useQuery({
    enabled: isConnected && !!address,
    queryFn: () =>
      fetch(`${hemiPointsUrl}/${address}`).then(
        ({ points }) => points,
      ) as Promise<number>,
    queryKey: ['hemi-points', address],
  })
}
