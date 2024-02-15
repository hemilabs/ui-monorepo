import { Chain } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

// These values will change once migrated to Hemi network
const hemiTestnet: Chain = {
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
  testnet: process.env.NEXT_PUBLIC_TESTNET_MODE === 'true',
}

// Currently, there's no data for mainnet, so let's copy the testnet data
// Once that's defined, we could use the flag in build time to compile either test or mainnet
// for exported hemi object
const hemiMainnet: Chain = {
  ...hemiTestnet,
}

export const hemi =
  (process.env.NEXT_PUBLIC_TESTNET_MODE ?? 'false') === 'true'
    ? hemiTestnet
    : hemiMainnet

const testnetMode = process.env.NEXT_PUBLIC_TESTNET_MODE === 'true'

export const bridgeableNetworks = testnetMode ? [sepolia] : [mainnet]

export const networks = [hemi, ...bridgeableNetworks]
