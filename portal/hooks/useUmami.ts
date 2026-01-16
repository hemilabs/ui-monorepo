import { useFormo } from '@formo/analytics'
import {
  AnalyticsEvent,
  EventDataMap,
  useUmami as useAnalytics,
} from 'app/analyticsEvents'

import { useNetworkType } from './useNetworkType'

// Events related to evm wallet connections, signatures, transactions, and chain changes
// These are automatically tracked on wagmi by Formo, so no need to track it ourselves
const walletEvents: AnalyticsEvent[] = [
  // Connection events
  'evm connect',
  'evm connected',
  'evm disconnected',
  'connect wallets',
  // Network/chain changes
  'network - automatic',
  'network - manual',
]

// Note: I'm "hooking up" on umami to also track on formo.
// If we remove formo, we may need to rename this hook
export const useUmami = function () {
  const [networkType] = useNetworkType()
  const umami = useAnalytics()
  const enabled = networkType === 'mainnet' && !!umami.track

  const analytics = useFormo()

  if (enabled) {
    return {
      enabled,
      track<T extends AnalyticsEvent>(
        event?: T,
        properties?: T extends keyof EventDataMap
          ? EventDataMap[T]
          : { [key: string]: unknown },
      ) {
        if (event) {
          // Always track with umami
          umami.track(event, properties)

          // Only track with analytics (formo) if it's not a wallet event
          if (!walletEvents.includes(event)) {
            analytics.track(event, properties)
          }
        } else {
          // page views do not take parameter, and
          // are tracked by default in formo
          // so we should skip them
          umami.track()
        }
      },
    } as const
  }

  // Return this separately so track key is not defined
  // improving type inference
  return { enabled: false } as const
}
