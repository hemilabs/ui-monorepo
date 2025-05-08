import { type Chain } from 'viem'

import { BtcSupportedNetworks } from '../unisat'

export type BtcChain = Omit<Chain, 'id'> & { id: BtcSupportedNetworks }

export const bitcoinTestnet = {
  blockExplorers: {
    default: {
      name: 'Mempool Explorer',
      url: 'https://mempool.space/testnet',
    },
  },
  id: 'testnet',
  name: 'Testnet Bitcoin',
  nativeCurrency: {
    decimals: 8,
    name: 'Testnet Bitcoin',
    symbol: 'tBTC',
  },
  rpcUrls: {
    default: {
      http: [],
      webSocket: [],
    },
    public: {
      http: [],
    },
  },
  testnet: true,
} satisfies BtcChain

export const bitcoinMainnet: BtcChain = {
  blockExplorers: {
    default: {
      name: 'Mempool Explorer',
      url: 'https://mempool.space',
    },
  },
  id: 'livenet',
  name: 'Bitcoin',
  nativeCurrency: {
    decimals: 8,
    name: 'Bitcoin',
    symbol: 'BTC',
  },
  rpcUrls: {
    default: {
      http: [],
      webSocket: [],
    },
    public: {
      http: [],
    },
  },
  testnet: false,
} satisfies BtcChain

export const bitcoinChains = [bitcoinMainnet, bitcoinTestnet]
