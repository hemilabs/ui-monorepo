'use client'

import * as Sentry from '@sentry/nextjs'
import { Connector, watchAccount } from '@wagmi/core'
import { WalletConnector } from 'btc-wallet/connectors/types'
import { useAccountEffect as useBtcAccountEffect } from 'btc-wallet/hooks/useAccountEffect'
import { useNetworkType } from 'hooks/useNetworkType'
import { useUmami } from 'hooks/useUmami'
import { usePathname } from 'i18n/navigation'
import { useCallback, useEffect } from 'react'
import { useConfig, useAccountEffect as useEvmAccountEffect } from 'wagmi'

export const GlobalTracking = function () {
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
        track?.('btc connected', {
          chain: networkType,
          wallet: connector.name,
        })
      },
      [networkType, track],
    ),
    onDisconnect: useCallback(
      function ({ connector }: { connector: WalletConnector }) {
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
      function ({ connector }: { connector: Connector }) {
        track?.('evm connected', {
          chain: networkType,
          wallet: connector.name,
        })
        Sentry.setTag('evm wallet', connector.name)
      },
      [networkType, track],
    ),
  })

  // The onDisconnect event from useEvmAccountEffect does not return
  // the connector the user disconnected from. This way we can access it
  useEffect(
    () =>
      watchAccount(config, {
        onChange(data, prevData) {
          if (
            prevData.status === 'connected' &&
            data.status === 'disconnected'
          ) {
            track?.('evm disconnected', {
              chain: networkType,
              wallet: prevData.connector.name,
            })
            Sentry.setTag('evm wallet', undefined)
          }
        },
      }),
    [config, networkType, track],
  )

  return null
}
