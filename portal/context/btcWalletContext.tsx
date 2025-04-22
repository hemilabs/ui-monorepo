'use client'

import { unisat } from 'btc-wallet/connectors/unisat'
import { BtcWalletProvider } from 'btc-wallet/context/btcWalletContext'
import { useBitcoin } from 'hooks/useBitcoin'
import { type ReactNode, useMemo } from 'react'

type Props = {
  children: ReactNode
}
export const BtcWalletContext = function ({ children }: Props) {
  const bitcoin = useBitcoin()

  const btcWalletConfig = useMemo(
    () => ({
      chains: [bitcoin],
      connectors: [unisat],
    }),
    [bitcoin],
  )

  return (
    <BtcWalletProvider config={btcWalletConfig}>{children}</BtcWalletProvider>
  )
}
