import { type Chain } from 'viem'

// See https://docs.hemi.xyz/metamask-wallet-setup
export const hemiTestnet = {
  blockExplorers: {
    default: {
      name: 'Hemi Sepolia Explorer',
      url: 'https://testnet.explorer.hemi.network',
    },
  },
  id: 743_111,
  name: 'Hemi Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Testnet Hemi Ether',
    symbol: 'thETH',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.rpc.hemi.network/rpc'],
      webSocket: ['wss://testnet.rpc.hemi.network/wsrpc'],
    },
    public: {
      http: ['https://testnet.rpc.hemi.network/rpc'],
    },
  },
  testnet: true,
} as const satisfies Chain
// For ↑, See https://wagmi.sh/core/api/chains#create-chain

// These are not live yet!
export const hemiMainnet = {
  blockExplorers: {
    default: {
      name: 'Hemi Explorer',
      url: 'https://explorer.hemi.network',
    },
  },
  id: 43_111,
  name: 'Hemi',
  nativeCurrency: {
    decimals: 18,
    name: 'Hemi Ether',
    symbol: 'hETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hemi.network/rpc'],
    },
    public: {
      http: ['https://rpc.hemi.network/rpc'],
    },
  },
  testnet: false,
} as const satisfies Chain
