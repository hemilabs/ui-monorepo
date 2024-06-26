import { BtcChain } from 'btc-wallet/chains'
import { Address, Chain } from 'viem'

type Extensions = {
  bridgeInfo?: {
    [keyof: string]: {
      tokenAddress?: Address
    }
  }
}

type BaseToken = {
  readonly address: string
  readonly chainId: Chain['id'] | BtcChain['id']
  readonly decimals: number
  readonly extensions?: Extensions
  readonly logoURI?: string
  readonly name: string
  readonly symbol: string
}

// only useful for Bitcoin in its blockchain
export type BtcToken = BaseToken & { chainId: BtcChain['id'] }
// includes erc20 and native tokens for all chains
export type EvmToken = BaseToken & { chainId: Chain['id'] }

export type Token = BtcToken | EvmToken
