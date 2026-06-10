import { BtcChain } from 'btc-wallet/chains'
import { Address, Chain } from 'viem'

type TunnelPartners = 'meson' | 'orbiter' | 'stargate'

export type Extensions = {
  birthBlock?: number
  l1LogoURI?: string
  bridgeInfo?: {
    [keyof: string]: {
      tokenAddress?: Address
    }
  }
  // Marks an ERC-4626 share token whose USD value should be computed via
  // `convertToAssets(shares) × peggedToken.price` so accumulated yield is
  // reflected; callers that don't have a pegged-amount handy must route
  // through a share-aware fiat helper instead of `getTokenPrice` directly.
  isVaultShare?: boolean
  protocol?: string
  // Use this to map which symbol should be used to map prices
  priceSymbol?: string
  // Custom token symbol to show in the Stake
  stakeSymbol?: string
  tunnel?: boolean
  // Custom token symbol to show in the Tunnel
  tunnelSymbol?: string
  tunnelPartners?: TunnelPartners[]
  tunnelDstAddress?: string
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
export type L2Token = EvmToken & { l1Token?: Address }

export type Token = BtcToken | EvmToken

// token with balance information
export type TokenWithBalance<T extends Token = Token> = T & { balance: bigint }
