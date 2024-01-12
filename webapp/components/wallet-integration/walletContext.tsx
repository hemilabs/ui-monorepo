'use client'

import 'styles/globals.css'

import '@rainbow-me/rainbowkit/styles.css'

import {
  getDefaultWallets,
  RainbowKitProvider,
  lightTheme,
} from '@rainbow-me/rainbowkit'
import { networks } from 'app/networks'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'

const { chains, publicClient } = configureChains(networks, [publicProvider()])

const { connectors } = getDefaultWallets({
  appName: process.env.NEXT_PUBLIC_APP_NAME,
  chains,
  projectId: process.env.NEXT_PUBLIC_RAINBOW_PROJECT_ID,
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

type WalletContextProps = {
  children: React.ReactNode
}

export const WalletContext = ({ children }: WalletContextProps) => (
  <WagmiConfig config={wagmiConfig}>
    <RainbowKitProvider
      chains={chains}
      theme={lightTheme({
        accentColor: 'black',
      })}
    >
      {children}
    </RainbowKitProvider>
  </WagmiConfig>
)
