import { BtcChain } from 'btc-wallet/chains'
import { Address, Chain } from 'viem'

export type Extensions = {
  birthBlock?: number
  bridgeInfo?: {
    [keyof: string]: {
      tokenAddress?: Address
    }
  }
  protocol?: string
  // Use this to map which symbol should be used to map prices
  priceSymbol?: string
  tunnel?: boolean
  tunnelPartner?: string
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
// superset of erc20 token with the info required from tunneling
export type L2Token = EvmToken & { l1Token: Address }

export type Token = BtcToken | EvmToken
