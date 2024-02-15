'use client'

import 'styles/globals.css'

import '@rainbow-me/rainbowkit/styles.css'

import {
  connectorsForWallets,
  RainbowKitProvider,
  lightTheme,
  type Locale,
} from '@rainbow-me/rainbowkit'
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets'
import { networks } from 'hemi-metadata'
import { useLocale } from 'next-intl'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'

const { chains, publicClient } = configureChains(networks, [publicProvider()])

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

type WalletContextProps = {
  children: React.ReactNode
}

export const WalletContext = function ({ children }: WalletContextProps) {
  const locale = useLocale()
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        chains={chains}
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
