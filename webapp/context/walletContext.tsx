'use client'

import {
  connectorsForWallets,
  RainbowKitProvider,
  lightTheme,
  type Locale,
} from '@rainbow-me/rainbowkit'
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { networks } from 'app/networks'
import { http } from 'viem'
import { WagmiProvider, createConfig } from 'wagmi'

type Props = {
  children: React.ReactNode
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

// we need a single instance of the config
let config: ReturnType<typeof createConfig> | undefined

export const getWalletConfig = function () {
  if (!config) {
    config = createConfig({
      chains: networks,
      connectors,
      transports: Object.fromEntries(
        networks.map(n => [
          n.id,
          http(n.rpcUrls.default.http[0], {
            batch: { wait: 1000 },
          }),
        ]),
      ),
    })
  }
  return config
}

export const WalletContext = ({ children, locale }: Props) => (
  <WagmiProvider config={getWalletConfig()}>
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
