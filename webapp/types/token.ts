import { Address } from 'viem'

type Extensions = {
  bridgeInfo: {
    [keyof: number]: {
      tokenAddress: Address
    }
  }
}
export type Token = {
  readonly address: string
  readonly chainId: number
  readonly decimals: number
  readonly extensions?: Extensions
  readonly logoURI?: string
  readonly name: string
  readonly symbol: string
}
