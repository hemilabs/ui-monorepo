import { Chain } from 'wagmi'

// These values will change once migrated to Hemi network
export const hemiTestnet: Chain = {
  blockExplorers: {
    default: {
      name: 'BVM Tesnet Explorer',
      url: 'http://216.219.89.253',
    },
  },
  id: 11155222,
  name: 'BVM Tesnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BVM',
    symbol: 'bvmETH',
  },
  // This field will be deprecated in viem v2, but it's required for now
  network: 'sepolia',
  rpcUrls: {
    default: {
      http: ['http://216.219.89.253:18546'],
    },
    public: {
      http: ['http://216.219.89.253:18546'],
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
