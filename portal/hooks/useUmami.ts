import { useUmami as useAnalytics } from 'app/analyticsEvents'

import { useNetworkType } from './useNetworkType'

export const useUmami = function () {
  const [networkType] = useNetworkType()
  const umami = useAnalytics()
  const enabled = networkType === 'mainnet'

  if (enabled) {
    return {
      enabled,
      track: umami.track,
    }
  }

  // Return this separately so track key is not defined
  // improving type inference
  return { enabled: false }
}
