import { tokenList } from 'app/tokenList/'
import { stakeProtocols, type StakeProtocols, StakeToken } from 'types/stake'
import { EvmToken, Token } from 'types/token'
import { type Chain, isAddress, isAddressEqual } from 'viem'

import { getNativeToken, isNativeAddress } from './nativeToken'

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

export const isEvmToken = (token: Token): token is EvmToken =>
  typeof token.chainId === 'number'

export const isStakeToken = (token: Token): token is StakeToken =>
  token.extensions?.protocol !== undefined &&
  // using cast here because we're trying to determine if a token's protocol
  // is a stake one
  stakeProtocols.includes(token.extensions.protocol as StakeProtocols)

export const isTunnelToken = (token: Token) => token.extensions?.tunnel === true

export const tunnelsThroughPartners = (token: Token) =>
  token.extensions?.tunnelPartners?.length > 0

export const getTokenPrice = function (
  token: Token,
  prices: Record<string, string>,
) {
  const priceSymbol = (
    token.extensions?.priceSymbol ?? token.symbol
  ).toUpperCase()
  const price = prices?.[priceSymbol] ?? '0'
  return price
}

export const getWrappedEther = (chainId: Chain['id']) =>
  tokenList.tokens.find(
    t => t.symbol === 'WETH' && t.chainId === chainId,
  ) as EvmToken
