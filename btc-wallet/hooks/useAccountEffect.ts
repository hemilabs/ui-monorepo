import { useContext, useEffect } from 'react'

import { WalletConnector } from '../connectors/types'
import { GlobalContext } from '../context/globalContext'

import { usePrevious } from './usePrevious'

type Parameters = {
  onConnect?(data: { connector: WalletConnector }): void
  onDisconnect?(data: { connector: WalletConnector }): void
}

export function useAccountEffect(parameters: Parameters = {}) {
  const { connectionStatus, currentConnector } = useContext(GlobalContext)

  const previousConnector = usePrevious(
    currentConnector,
    (prev, next) => prev?.id === next?.id,
  )

  const { onConnect, onDisconnect } = parameters

  useEffect(
    function watchConnectionStatus() {
      if (connectionStatus === 'connected') {
        onConnect?.({ connector: currentConnector })
      }
      // once disconnected, currentConnector is null, so we need to manually persist
      // the value before disconnection
      if (connectionStatus === 'disconnected' && previousConnector) {
        onDisconnect?.({ connector: previousConnector })
      }
    },
    [
      connectionStatus,
      currentConnector,
      onConnect,
      onDisconnect,
      previousConnector,
    ],
  )
}
