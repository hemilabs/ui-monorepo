import { Chain } from 'wagmi'

// See https://docs.hemi.xyz/metamask-wallet-setup
export const hemiTestnet: Chain = {
  blockExplorers: {
    default: {
      name: 'Hemi Tesnet Explorer',
      url: 'https://testnet.explorer.hemi.network/',
    },
  },
  id: 743_111,
  name: 'Hemi Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Testnet Hemi Ether',
    symbol: 'thETH',
  },
  // This field will be deprecated in viem v2, but it's required for now
  network: 'sepolia',
  rpcUrls: {
    default: {
      http: ['https://testnet.rpc.hemi.network/rpc'],
    },
    public: {
      http: ['https://testnet.rpc.hemi.network/rpc'],
    },
  },
  testnet: true,
}

// Currently, there's no data for mainnet, so let's copy the testnet data
// Once that's defined, we could use the flag in build time to compile either test or mainnet
// for exported hemi object
export const hemiMainnet: Chain = {
  ...hemiTestnet,
  testnet: false,
}
