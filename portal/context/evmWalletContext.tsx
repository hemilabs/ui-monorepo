'use client'

import {
  connectorsForWallets,
  RainbowKitProvider,
  lightTheme,
  type Locale,
} from '@rainbow-me/rainbowkit'
import {
  metaMaskWallet,
  okxWallet,
  rabbyWallet,
  tokenPocketWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { allEvmNetworks } from 'networks'
import { buildTransports } from 'utils/transport'
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
      wallets: [
        metaMaskWallet,
        okxWallet,
        rabbyWallet,
        tokenPocketWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: 'Hemi Portal',
    projectId:
      // the ?? is needed to compile - if undefined, throws an error. When building
      // to deploy, this variable will be set.
      process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  },
)

export const allEvmNetworksWalletConfig = createConfig({
  chains: allEvmNetworks,
  connectors,
  transports: buildTransports(allEvmNetworks),
})

export const EvmWalletContext = ({ children, locale }: Props) => (
  <WagmiProvider config={allEvmNetworksWalletConfig}>
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
