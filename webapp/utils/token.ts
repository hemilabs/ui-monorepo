import { tokenList } from 'app/tokenList/'
import { stakeProtocols, type StakeProtocols, StakeToken } from 'types/stake'
import { EvmToken, Token } from 'types/token'
import {
  type Address,
  type Client,
  erc20Abi,
  isAddress,
  isAddressEqual,
} from 'viem'
import { readContract } from 'viem/actions'

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

export const getErc20TokenBalance = ({
  address,
  client,
  token,
}: {
  address: Address
  client: Client
  token: EvmToken
}) =>
  readContract(client, {
    abi: erc20Abi,
    address: token.address as Address,
    args: [address],
    functionName: 'balanceOf',
  })

export const isStakeToken = (token: Token): token is StakeToken =>
  token.extensions?.protocol !== undefined &&
  // using cast here because we're trying to determine if a token's protocol
  // is a stake one
  stakeProtocols.includes(token.extensions.protocol as StakeProtocols)

export const isTunnelToken = (token: Token) => token.extensions?.tunnel === true

export const tunnelsThroughPartner = (token: Token) =>
  token.extensions?.tunnelPartner !== undefined
