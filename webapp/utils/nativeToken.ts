import { NativeTokenSpecialAddressOnL2, tokenList } from 'token-list'
import { Token } from 'types/token'
import { isAddress, isAddressEqual, zeroAddress } from 'viem'

export const isNativeAddress = (address: string) =>
  address === zeroAddress ||
  !address.startsWith('0x') ||
  (isAddress(address) && isAddressEqual(address, NativeTokenSpecialAddressOnL2))

export const isNativeToken = (token: Token) => isNativeAddress(token.address)

export const getNativeToken = (chainId: Token['chainId']) =>
  tokenList.tokens.find(
    token => token.chainId === chainId && isNativeToken(token),
  )
