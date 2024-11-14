import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { tokenList } from 'tokenList'
import { EvmToken, Token } from 'types/token'
import { Address, isAddress, isAddressEqual, zeroAddress } from 'viem'

export const isNativeAddress = (address: string) =>
  address === zeroAddress || !address.startsWith('0x')

export const isNativeToken = (token: Token) => isNativeAddress(token.address)

export const getNativeToken = (chainId: Token['chainId']) =>
  tokenList.tokens.find(
    token => token.chainId === chainId && isNativeToken(token),
  )

export const getTokenByAddress = function (
  address: Token['address'],
  chainId: Token['chainId'],
) {
  if (isNativeAddress(address)) {
    return getNativeToken(chainId)
  }
  return tokenList.tokens.find(
    token =>
      token.chainId === chainId &&
      isAddress(token.address) &&
      // @ts-expect-error we already checked "address" is not native, so string is `0x${string}`
      isAddressEqual(token.address, address),
  )
}

export const getL2TokenByBridgedAddress = (
  address: Address,
  l1ChainId: Token['chainId'],
) =>
  tokenList.tokens.find(
    token =>
      (token.chainId === hemiMainnet.id || token.chainId === hemiTestnet.id) &&
      token.extensions?.bridgeInfo?.[l1ChainId]?.tokenAddress &&
      isAddressEqual(
        token.extensions.bridgeInfo[l1ChainId].tokenAddress,
        address,
      ),
  )

export const isEvmToken = (token: Token): token is EvmToken =>
  typeof token.chainId === 'number'
