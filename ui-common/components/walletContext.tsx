'use client'

import {
  connectorsForWallets,
  RainbowKitProvider,
  lightTheme,
  type Locale,
} from '@rainbow-me/rainbowkit'
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets'
import { useMemo } from 'react'
import { type Chain, configureChains, createConfig, WagmiConfig } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'

type Props = {
  children: React.ReactNode
  networks: Chain[]
  locale: Locale
}

export const WalletContext = function ({ children, networks, locale }: Props) {
  const { chains, publicClient } = useMemo(
    () => configureChains(networks, [publicProvider()]),
    networks,
  )

  const connectors = connectorsForWallets([
    {
      groupName: 'Wallets',
      // internally "metaMaskWallet" has code for wallet connect. If we don't set version to 1, typings requires us
      // to pass a projectId that is generated in wallet connect's website
      // after all, (for now) we won't support wallet connect.
      wallets: [metaMaskWallet({ chains, walletConnectVersion: '1' })],
    },
  ])

  const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
  })

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        chains={networks}
        locale={locale as Locale}
        theme={lightTheme({
          accentColor: 'black',
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
