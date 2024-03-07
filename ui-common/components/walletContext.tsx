'use client'

import {
  connectorsForWallets,
  RainbowKitProvider,
  lightTheme,
  type Locale,
} from '@rainbow-me/rainbowkit'
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMemo } from 'react'
import { type Chain, http } from 'viem'
import { WagmiProvider, createConfig } from 'wagmi'

type Props = {
  children: React.ReactNode
  networks: readonly [Chain, ...Chain[]]
  locale: Locale
}

const queryClient = new QueryClient()

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Wallets',
      wallets: [metaMaskWallet],
    },
  ],
  {
    // These values are required but not actually used, unless wallet connect is enabled
    appName: 'My RainbowKit App',
    projectId: 'YOUR_PROJECT_ID',
  },
)

export const WalletContext = function ({ children, networks, locale }: Props) {
  const wagmiConfig = useMemo(
    () =>
      createConfig({
        chains: networks,
        connectors,
        transports: Object.fromEntries(networks.map(n => [n.id, http()])),
      }),
    [networks],
  )

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          locale={locale as Locale}
          theme={lightTheme({
            accentColor: 'black',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
