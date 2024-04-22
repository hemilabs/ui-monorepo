import { Chain } from '@rainbow-me/rainbowkit'
import { hemi } from 'app/networks'
import { tokenList } from 'tokenList'
import { Token } from 'types/token'
import { Address } from 'viem'

export const ZeroAddress = '0x'.padEnd(42, '0') as Address

const isNativeAddress = (address: string) => !address.startsWith('0x')
export const isNativeToken = (token: Token) => isNativeAddress(token.address)

export const getTokenByAddress = (address: Address, chainId: Chain['id']) =>
  tokenList.tokens.find(
    token => token.chainId === chainId && token.address === address,
  )

export const getL2TokenByBridgedAddress = (
  address: Address,
  l1ChainId: Chain['id'],
) =>
  tokenList.tokens.find(
    token =>
      token.chainId === hemi.id &&
      token.extensions?.bridgeInfo?.[l1ChainId]?.tokenAddress === address,
  )
