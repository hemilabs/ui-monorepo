import { Chain } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

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

const testnetMode = process.env.NEXT_PUBLIC_TESTNET_MODE === 'true'

export const bridgableNetworks = testnetMode ? [sepolia] : [mainnet]

export const networks = [bvm, ...bridgableNetworks]
