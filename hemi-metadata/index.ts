import { type Chain } from 'viem'

// See https://docs.hemi.xyz/metamask-wallet-setup
export const hemiTestnet = {
  blockExplorers: {
    default: {
      name: 'Hemi Tesnet Explorer',
      url: 'https://testnet.explorer.hemi.network',
    },
  },
  id: 743_111,
  name: 'Hemi Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Testnet Hemi Ether',
    symbol: 'thETH',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.rpc.hemi.network/rpc'],
    },
    public: {
      http: ['https://testnet.rpc.hemi.network/rpc'],
    },
  },
  testnet: true,
} as const satisfies Chain
// For ↑, See https://wagmi.sh/core/api/chains#create-chain

// Currently, there's no data for mainnet, so let's copy the testnet data
// Once that's defined, we could use the flag in build time to compile either test or mainnet
// for exported hemi object
export const hemiMainnet = {
  ...hemiTestnet,
  testnet: false,
} as const satisfies Chain
