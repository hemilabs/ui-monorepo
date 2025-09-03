import { type BtcChain } from 'btc-wallet/chains'
import { type Chain } from 'viem'

export type OrderedChains = readonly [Chain, ...Chain[]]

// Remote chains are those who can tunnel from/to Hemi
export type RemoteChain = BtcChain | Chain
