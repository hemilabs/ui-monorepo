'use client'

import binanceWallet from '@binance/w3w-rainbow-connector-v2'
import {
  connectorsForWallets,
  RainbowKitProvider,
  lightTheme,
  type Locale,
} from '@rainbow-me/rainbowkit'
import {
  coinbaseWallet,
  metaMaskWallet,
  okxWallet,
  phantomWallet,
  rabbyWallet,
  tokenPocketWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { allEvmNetworks } from 'networks'
import { buildTransports } from 'utils/transport'
import { WagmiProvider, createConfig } from 'wagmi'
import { walletConnect } from 'wagmi/connectors'

type Props = {
  children: React.ReactNode
  locale: Locale
}

const queryClient = new QueryClient()

const appName = 'Hemi Portal'
const projectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? 'YOUR_PROJECT_ID'

const configuredWallets = [
  metaMaskWallet,
  binanceWallet,
  walletConnectWallet,
  okxWallet,
  rabbyWallet,
  coinbaseWallet,
  phantomWallet,
  tokenPocketWallet,
]

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Wallets',
      wallets: configuredWallets,
    },
  ],
  {
    appName,
    projectId,
  },
)

export const allEvmNetworksWalletConfig = createConfig({
  chains: allEvmNetworks,
  connectors: [
    walletConnect({
      projectId,
      showQrModal: false,
    }),
    ...connectors,
  ],
  transports: buildTransports(allEvmNetworks),
})

export const allWalletConnectors = configuredWallets.map(wallet =>
  wallet({ appName, projectId }),
)

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
