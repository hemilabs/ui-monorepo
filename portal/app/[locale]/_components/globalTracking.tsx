'use client'

import * as Sentry from '@sentry/nextjs'
import { Connector, watchAccount } from '@wagmi/core'
import { WalletConnector } from 'btc-wallet/connectors/types'
import { useAccountEffect as useBtcAccountEffect } from 'btc-wallet/hooks/useAccountEffect'
import { useUmami } from 'hooks/useUmami'
import { usePathname } from 'i18n/navigation'
import { useCallback, useEffect } from 'react'
import { useConfig, useAccountEffect as useEvmAccountEffect } from 'wagmi'

export const GlobalTracking = function () {
  const config = useConfig()
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
          wallet: connector.name,
        })
      },
      [track],
    ),
    onDisconnect: useCallback(
      function ({ connector }: { connector: WalletConnector }) {
        track?.('btc disconnected', {
          wallet: connector.name,
        })
      },
      [track],
    ),
  })

  useEvmAccountEffect({
    onConnect: useCallback(
      function ({ connector }: { connector: Connector }) {
        track?.('evm connected', {
          wallet: connector.name,
        })
        Sentry.setTag('evm wallet', connector.name)
      },
      [track],
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
              wallet: prevData.connector.name,
            })
            Sentry.setTag('evm wallet', undefined)
          }
        },
      }),
    [config, track],
  )

  return null
}
