import { type Config, readContract } from '@wagmi/core'
import pMemoize from 'promise-mem'
import { tokenList } from 'tokenList'
import { stakeProtocols, type StakeProtocols, StakeToken } from 'types/stake'
import { EvmToken, L2Token, Token } from 'types/token'
import {
  type Address,
  type Chain,
  erc20Abi,
  isAddress,
  isAddressEqual,
  checksumAddress as toChecksum,
  parseUnits as viemParseUnits,
} from 'viem'

import { getNativeToken, isNativeAddress } from './nativeToken'
import { opErc20Abi } from './opErc20Abi'

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

export const getErc20Token = pMemoize(
  async function ({
    address,
    chainId,
    config,
  }: {
    address: Address
    chainId: Chain['id']
    config: Config
  }) {
    const read = <T extends 'decimals' | 'name' | 'symbol'>(functionName: T) =>
      readContract(config, {
        abi: erc20Abi,
        address,
        chainId,
        functionName,
      })

    return Promise.all([read('decimals'), read('name'), read('symbol')]).then(
      ([decimals, name, symbol]) =>
        ({
          address: toChecksum(address, chainId),
          chainId,
          decimals,
          name,
          symbol,
        }) satisfies Token,
    )
  },
  { resolver: ({ address, chainId }) => `${address}-${chainId}` },
)

export const getL2Erc20Token = pMemoize(
  async ({
    address,
    chainId,
    config,
  }: {
    address: Address
    chainId: Chain['id']
    config: Config
  }) =>
    Promise.all([
      getErc20Token({ address, chainId, config }),
      readContract(config, {
        abi: opErc20Abi,
        address,
        chainId,
        functionName: 'l1Token',
      }),
    ]).then(
      ([token, l1Token]) =>
        ({
          ...token,
          address,
          l1Token: toChecksum(l1Token, chainId),
        }) as L2Token,
    ),
  { resolver: ({ address, chainId }) => `${address}-${chainId}` },
)

/**
 * Parses a token amount string into its raw representation in the smallest unit (e.g., wei for ETH)
 * truncating any excess decimal places beyond the token's defined decimals.
 * @param amount - The token amount as a string.
 * @param token - The token metadata, including its decimals.
 * @returns The parsed token amount in the smallest unit.
 */
export const parseTokenUnits = function (amount: string, token: Token) {
  const [whole, fraction] = amount.split('.')
  const truncatedFraction = fraction?.slice(0, token.decimals)
  const normalizedAmount = truncatedFraction
    ? `${whole}.${truncatedFraction}`
    : whole
  return viemParseUnits(normalizedAmount, token.decimals)
}
