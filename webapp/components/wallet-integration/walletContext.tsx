'use client'

import 'styles/globals.css'

import '@rainbow-me/rainbowkit/styles.css'

import {
  getDefaultWallets,
  RainbowKitProvider,
  lightTheme,
} from '@rainbow-me/rainbowkit'
import { Chain, configureChains, createConfig, WagmiConfig } from 'wagmi'
import { mainnet, sepolia, holesky, optimism } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'

export const bvm: Chain = {
  blockExplorers: {
    default: {
      name: process.env.NEXT_PUBLIC_CHAIN_EXPLORER_NAME,
      url: process.env.NEXT_PUBLIC_CHAIN_EXPLORER_URL,
    },
  },
  id: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID),
  name: process.env.NEXT_PUBLIC_CHAIN_NAME,
  nativeCurrency: {
    decimals: parseInt(process.env.NEXT_PUBLIC_CHAIN_CURRENCY_DECIMALS),
    name: process.env.NEXT_PUBLIC_CHAIN_CURRENCY_NAME,
    symbol: process.env.NEXT_PUBLIC_CHAIN_CURRENCY_SYMBOL,
  },
  network: process.env.NEXT_PUBLIC_CHAIN_NETWORK,
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_CHAIN_RPC_URL],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_CHAIN_RPC_URL],
    },
  },
  testnet: true,
}

export const networks = [mainnet, sepolia, holesky, optimism, bvm]

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
