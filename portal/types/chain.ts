import { type Chain as RainbowKitChain } from '@rainbow-me/rainbowkit'
import { type BtcChain } from 'btc-wallet/chains'
import { type Chain } from 'viem'

export type EvmChain = Omit<Chain, 'fees' | 'serializers'> &
  Pick<RainbowKitChain, 'iconBackground' | 'iconUrl'>

export type OrderedChains = readonly [EvmChain, ...EvmChain[]]

// Remote chains are those who can tunnel from/to Hemi
export type RemoteChain = BtcChain | EvmChain
