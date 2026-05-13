import { createContext, useState } from 'react'

import { WalletConnector } from '../connectors/types'
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
  setConnectionStatus: () => undefined,
  setCurrentConnector: () => undefined,
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
