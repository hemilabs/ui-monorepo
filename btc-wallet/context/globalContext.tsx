import { WalletConnector } from 'btc-wallet/connectors/types'
import { createContext, useState } from 'react'

import { ConnectionStatus } from '../types'

type GlobalState = {
  connectionStatus: ConnectionStatus
  currentConnector: WalletConnector | undefined
  setConnectionStatus: (status: ConnectionStatus) => void
  setCurrentConnector: (connector: WalletConnector | undefined) => void
}

export const GlobalContext = createContext<GlobalState>({
  connectionStatus: 'disconnected',
  currentConnector: undefined,
  setConnectionStatus: () => {},
  setCurrentConnector: () => {},
})

type Props = {
  children: React.ReactNode
}

export const GlobalContextProvider = function ({ children }: Props) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected')
  const [currentConnector, setCurrentConnector] = useState<
    WalletConnector | undefined
  >(undefined)

  return (
    <GlobalContext.Provider
      value={{
        connectionStatus,
        currentConnector,
        setConnectionStatus,
        setCurrentConnector,
      }}
    >
      {children}
    </GlobalContext.Provider>
  )
}
