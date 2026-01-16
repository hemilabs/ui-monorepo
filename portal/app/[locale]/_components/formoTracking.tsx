// This component's content may replace globalTracking.tsx if we remove
// umami in favor of Formo Analytics in the future.

import { useFormo } from '@formo/analytics'
import { useEffect } from 'react'
import { useAccount } from 'wagmi'

export const FormoTracking = function () {
  const { address } = useAccount()
  const analytics = useFormo()

  useEffect(
    function () {
      if (address && analytics) {
        analytics.identify({ address })
      }
    },
    [address, analytics],
  )

  return null
}
