import {
  nativeTokens,
  NativeTokenSpecialAddressOnL2,
} from 'tokenList/nativeTokens'
import { Token } from 'types/token'
import { isAddress, isAddressEqual, zeroAddress } from 'viem'

export const isNativeAddress = (address: string) =>
  address === zeroAddress ||
  !address.startsWith('0x') ||
  (isAddress(address) && isAddressEqual(address, NativeTokenSpecialAddressOnL2))

export const isNativeToken = (token: Token) => isNativeAddress(token.address)

export const getNativeToken = function (chainId: Token['chainId']) {
  const nativeToken = nativeTokens.find(
    token => token.chainId === chainId && isNativeToken(token),
  )
  if (!nativeToken) {
    throw new Error(`Could not find native token for chainId ${chainId}`)
  }
  return nativeToken
}
