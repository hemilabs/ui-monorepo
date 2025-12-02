'use client'

import { bitcoinTestnet, bitcoinMainnet } from 'btc-wallet/chains'
import { okx } from 'btc-wallet/connectors/okx'
import { unisat } from 'btc-wallet/connectors/unisat'
import { BtcWalletProvider } from 'btc-wallet/context/btcWalletContext'
import { type ReactNode } from 'react'

const btcWalletConfig = {
  chains: [bitcoinMainnet, bitcoinTestnet],
  connectors: [unisat, okx],
}

type Props = {
  children: ReactNode
}
export const BtcWalletContext = ({ children }: Props) => (
  <BtcWalletProvider config={btcWalletConfig}>{children}</BtcWalletProvider>
)
