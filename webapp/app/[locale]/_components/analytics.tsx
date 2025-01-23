'use client'

import { Connector, watchAccount } from '@wagmi/core'
import { featureFlags } from 'app/featureFlags'
import { WalletConnector } from 'btc-wallet/connectors/types'
import { useAccountEffect as useBtcAccountEffect } from 'btc-wallet/hooks/useAccountEffect'
import { UmamiAnalyticsProvider } from 'components/umamiAnalyticsProvider'
import { useNetworkType } from 'hooks/useNetworkType'
import { useUmami } from 'hooks/useUmami'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ReactNode, useCallback, useEffect } from 'react'
import { useConfig, useAccountEffect as useEvmAccountEffect } from 'wagmi'

const GlobalTracking = function () {
  const config = useConfig()
  const [networkType] = useNetworkType()
  const pathname = usePathname()
  const { track } = useUmami()

  useEffect(
    function trackPageView() {
      if (track) {
        track()
      }
    },
    [pathname, track],
  )

  useBtcAccountEffect({
    onConnect: useCallback(
      function ({ connector }: { connector: WalletConnector }) {
        if (featureFlags.btcTunnelEnabled) {
          track?.('btc connected', {
            chain: networkType,
            wallet: connector.name,
          })
        }
      },
      [networkType, track],
    ),
    onDisconnect: useCallback(
      function ({ connector }: { connector: WalletConnector }) {
        if (featureFlags.btcTunnelEnabled)
          track?.('btc disconnected', {
            chain: networkType,
            wallet: connector.name,
          })
      },
      [networkType, track],
    ),
  })

  useEvmAccountEffect({
    onConnect: useCallback(
      ({ connector }: { connector: Connector }) =>
        track?.('evm connected', {
          chain: networkType,
          wallet: connector.name,
        }),
      [networkType, track],
    ),
  })

  // The onDisconnect event from useEvmAccountEffect does not return
  // the connector the user disconnected from. This way we can access it
  useEffect(
    () =>
      watchAccount(config, {
        onChange(data, prevData) {
          if (prevData.status === 'connected' && data.status === 'disconnected')
            track?.('evm disconnected', {
              chain: networkType,
              wallet: prevData.connector.name,
            })
        },
      }),
    [config, networkType, track],
  )

  return null
}

export const Analytics = function ({ children }: { children: ReactNode }) {
  const locale = useLocale()

  const removeLocaleAndTrailingSlash = (url: string) =>
    (url.endsWith('/') ? url.slice(0, -1) : url).replace(`/${locale}`, '')

  return (
    <UmamiAnalyticsProvider
      autoTrack={false}
      processUrl={removeLocaleAndTrailingSlash}
      {...(process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' && {
        src: process.env.NEXT_PUBLIC_ANALYTICS_URL,
        websiteId: process.env.NEXT_PUBLIC_ANALYTICS_WEBSITE_ID,
      })}
    >
      <GlobalTracking />
      {children}
    </UmamiAnalyticsProvider>
  )
}
