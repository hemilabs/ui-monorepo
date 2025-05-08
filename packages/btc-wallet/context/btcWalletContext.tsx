import { ConnectorGroup } from 'btc-wallet/connectors/types'
import { createContext } from 'react'

import { type BtcChain } from '../chains'
import { isChainSupported } from '../utils/chains'

import { GlobalContextProvider } from './globalContext'

export type BtcContextConfig = {
  chains: BtcChain[]
  connectors: ConnectorGroup[]
}

export const BtcWalletContext = createContext<BtcContextConfig | undefined>(
  undefined,
)

type Props = {
  children: React.ReactNode
  config: BtcContextConfig
}

export const BtcWalletProvider = function ({ children, config }: Props) {
  if (config.chains.length === 0) {
    throw new Error('No definition of chains supplied')
  }
  const unsupportedChains = config.chains.filter(c => !isChainSupported(c))
  if (unsupportedChains.length > 0) {
    throw new Error(
      `Invalid chain definition supplied: id ${unsupportedChains
        .map(c => c.id)
        .join()}`,
    )
  }

  return (
    <BtcWalletContext.Provider value={config}>
      <GlobalContextProvider>{children}</GlobalContextProvider>
    </BtcWalletContext.Provider>
  )
}
