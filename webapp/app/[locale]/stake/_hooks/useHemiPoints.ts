import * as Sentry from '@sentry/nextjs'
import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { useEffect } from 'react'
import { useAccount } from 'wagmi'

const hemiPointsUrl = process.env.NEXT_PUBLIC_POINTS_URL

export const useHemiPoints = function () {
  const { address, isConnected } = useAccount()

  const query = useQuery({
    enabled: isConnected && !!address,
    queryFn: () =>
      fetch(`${hemiPointsUrl}/${address}`).then(
        ({ points }) => points,
      ) as Promise<number>,
    queryKey: ['hemi-points', address],
  })

  const { error } = query

  useEffect(
    function captureHemiPriceError() {
      if (error) {
        Sentry.captureException(
          new Error('Failed to fetch the Points api', { cause: error }),
        )
      }
    },
    [error],
  )

  return query
}
