'use client'

import { bitcoin } from 'app/networks'
import { unisat } from 'btc-wallet/connectors/unisat'
import { BtcWalletProvider } from 'btc-wallet/context/btcWalletContext'
import React from 'react'

const btcWalletConfig = {
  chains: [bitcoin],
  connectors: [{ name: 'Unisat', wallet: unisat }],
}

type Props = {
  children: React.ReactNode
}
export const BtcWalletContext = ({ children }: Props) => (
  <BtcWalletProvider config={btcWalletConfig}>{children}</BtcWalletProvider>
)
