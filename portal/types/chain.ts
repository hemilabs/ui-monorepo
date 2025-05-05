import { type BtcChain } from 'btc-wallet/chains'
import { type Chain } from 'viem'

export type EvmChain = Omit<Chain, 'fees' | 'serializers'> & {
  iconUrl?: string | (() => Promise<string>) | null
  iconBackground?: string
}

export type OrderedChains = readonly [EvmChain, ...EvmChain[]]

// Remote chains are those who can tunnel from/to Hemi
export type RemoteChain = BtcChain | EvmChain
