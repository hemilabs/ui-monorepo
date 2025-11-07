import hemilabsTokenList from '@hemilabs/token-list'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { type RemoteChain } from 'types/chain'
import { type EvmToken, type Token } from 'types/token'
import { type Address, isAddress, getAddress } from 'viem'

import { customTunnelPartnersWhitelist } from './customTunnelPartnersWhitelist'
import { nativeTokens } from './nativeTokens'
import { priceWhiteList } from './priceTokens'
import { stakeWhiteList } from './stakeTokens'
import { tunnelWhiteList } from './tunnelTokens'

const extendWithWhiteList = <
  T extends Partial<Record<RemoteChain['id'], Record<string, object>>>,
>(
  whiteList: T,
) =>
  function (token: Token) {
    const extensions = whiteList[token.chainId]?.[token.address]
    if (!extensions) {
      return token
    }
    return {
      ...token,
      extensions: {
        ...token.extensions,
        ...extensions,
      },
    }
  }

const normalizeAddress = (address: string) =>
  isAddress(address, { strict: false }) ? getAddress(address) : address

export const normalizeToken = <T extends Token = Token>(token: T) =>
  ({
    ...token,
    address: normalizeAddress(token.address),
    extensions: {
      ...token.extensions,
      ...(token.extensions?.bridgeInfo
        ? {
            bridgeInfo: Object.fromEntries(
              Object.keys(token.extensions!.bridgeInfo!).map(l1ChainId => [
                l1ChainId,
                {
                  ...token.extensions!.bridgeInfo![l1ChainId],
                  tokenAddress: normalizeAddress(
                    token.extensions!.bridgeInfo![l1ChainId].tokenAddress!,
                  ),
                },
              ]),
            ),
          }
        : {}),
    } as Token['extensions'],
  }) as T

export const getRemoteTokens = function (token: EvmToken) {
  if (!token.extensions?.bridgeInfo) {
    return [] satisfies EvmToken[]
  }
  return Object.keys(token.extensions!.bridgeInfo!).map(l1ChainId =>
    normalizeToken({
      ...token,
      address: token.extensions!.bridgeInfo![l1ChainId].tokenAddress!,
      chainId: Number(l1ChainId),
      extensions: {
        bridgeInfo: {
          [token.chainId]: {
            tokenAddress: token.address as Address,
          },
        },
      },
      logoURI: token.extensions!.l1LogoURI,
      name: token.name
        // Remove the ".e" suffix
        .replace('.e', '')
        .trim(),
      symbol: token.symbol
        // Remove the ".e" suffix
        .replace('.e', '')
        .trim(),
    }),
  ) as EvmToken[]
}

const hemiTokens: EvmToken[] = (hemilabsTokenList.tokens as EvmToken[]).filter(
  t => t.chainId === hemiMainnet.id || t.chainId === hemiTestnet.id,
)

// the hemiTokens only contains definitions for Hemi tokens, but we can create the L1 version with the extensions field info
const tokens: Token[] = hemiTokens.concat(hemiTokens.flatMap(getRemoteTokens))

export const tokenList = {
  name: hemilabsTokenList.name,
  tags: {},
  timestamp: hemilabsTokenList.timestamp,
  tokens: tokens
    .concat(nativeTokens)
    .map(extendWithWhiteList(customTunnelPartnersWhitelist))
    .map(extendWithWhiteList(priceWhiteList))
    .map(extendWithWhiteList(stakeWhiteList))
    .map(extendWithWhiteList(tunnelWhiteList))
    .sort((a, b) => a.symbol.localeCompare(b.symbol)),
}
