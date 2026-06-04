import pMemoize from 'promise-mem'
import { tokenList } from 'tokenList'
import { stakeProtocols, type StakeProtocols, StakeToken } from 'types/stake'
import { EvmToken, L2Token, Token } from 'types/token'
import { Token as TokenType } from 'types/token'
import { getPublicClient } from 'utils/chainClients'
import {
  type Address,
  type Chain,
  isAddress,
  isAddressEqual,
  checksumAddress as toChecksum,
  parseUnits as viemParseUnits,
} from 'viem'
import { readContract } from 'viem/actions'
import {
  decimals as getDecimals,
  name as getName,
  symbol as getSymbol,
} from 'viem-erc20/actions'

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

export const isCustomToken = (userTokenList: TokenType[], token: TokenType) =>
  userTokenList.some(
    t => t.address === token.address && t.chainId === token.chainId,
  )

export const isEvmToken = (token: Token): token is EvmToken =>
  typeof token.chainId === 'number'

export const isStakeToken = (token: Token): token is StakeToken =>
  token.extensions?.protocol !== undefined &&
  // using cast here because we're trying to determine if a token's protocol
  // is a stake one
  stakeProtocols.includes(token.extensions.protocol as StakeProtocols)

export const isTunnelToken = (token: Token) => token.extensions?.tunnel === true

export const tunnelsThroughPartners = (token: Token) =>
  (token.extensions?.tunnelPartners?.length ?? 0) > 0

export const getTokenPrice = function (
  token: Token,
  prices: Record<string, string> | undefined,
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
  }: {
    address: Address
    chainId: Chain['id']
  }) {
    const client = getPublicClient(chainId)

    return Promise.all([
      getDecimals(client, { address }),
      getName(client, { address }),
      getSymbol(client, { address }),
    ]).then(
      ([decimals, name, symbol]) =>
        ({
          address: toChecksum(address),
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
  async ({ address, chainId }: { address: Address; chainId: Chain['id'] }) =>
    Promise.all([
      getErc20Token({ address, chainId }),
      readContract(getPublicClient(chainId), {
        abi: opErc20Abi,
        address,
        functionName: 'l1Token',
        // The token may not have an l1 counter part
      }).catch(() => undefined),
    ]).then(
      ([token, l1Token]) =>
        ({
          ...token,
          address,
          l1Token: l1Token ? toChecksum(l1Token, chainId) : undefined,
        }) satisfies L2Token,
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
