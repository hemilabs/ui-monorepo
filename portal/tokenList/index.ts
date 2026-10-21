import hemilabsTokenList from '@hemilabs/token-list'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { type RemoteChain } from 'types/chain'
import { type EvmToken, type Token } from 'types/token'
import { toChecksumAddress } from 'utils/address'
import { getL1LogoURI } from 'utils/l1Logo'
import { type Address } from 'viem'

import { customTunnelPartnersWhitelist } from './customTunnelPartnersWhitelist'
import { displayOverrides } from './displayOverrides'
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

export const normalizeToken = <T extends Token = Token>(token: T) =>
  ({
    ...token,
    address: toChecksumAddress(token.address),
    extensions: {
      ...token.extensions,
      ...(token.extensions?.bridgeInfo
        ? {
            bridgeInfo: Object.fromEntries(
              Object.keys(token.extensions!.bridgeInfo!).map(l1ChainId => [
                l1ChainId,
                {
                  ...token.extensions!.bridgeInfo![l1ChainId],
                  tokenAddress: toChecksumAddress(
                    token.extensions!.bridgeInfo![l1ChainId].tokenAddress!,
                  ),
                },
              ]),
            ),
          }
        : {}),
    } as Token['extensions'],
  }) as T

const sourceChainIds: Partial<Record<Token['chainId'], number>> = {
  [hemiMainnet.id]: hemiMainnet.sourceId,
  [hemiTestnet.id]: hemiTestnet.sourceId,
}

const createRemoteToken = ({
  chainId,
  extensions,
  token,
  tokenAddress,
}: {
  chainId: string
  extensions: Token['extensions']
  token: EvmToken
  tokenAddress: string
}) =>
  normalizeToken({
    ...token,
    address: tokenAddress,
    chainId: Number(chainId),
    extensions,
    logoURI: getL1LogoURI(token),
    name: token.name
      // Remove the ".e" suffix
      .replace('.e', '')
      .trim(),
    symbol: token.symbol
      // Remove the ".e" suffix
      .replace('.e', '')
      .trim(),
  })

export const getRemoteTokens = function (token: EvmToken) {
  const bridgeInfo = token.extensions?.bridgeInfo ?? {}
  const bridgedTokens = Object.keys(bridgeInfo)
    // Bitcoin pairs (e.g. "livenet") are native tokens, not EVM remote tokens
    .filter(l1ChainId => Number.isInteger(Number(l1ChainId)))
    .map(l1ChainId =>
      createRemoteToken({
        chainId: l1ChainId,
        extensions: {
          allowanceSlot: bridgeInfo[l1ChainId].allowanceSlot,
          bridgeInfo: {
            [token.chainId]: {
              tokenAddress: token.address as Address,
            },
          },
        },
        token,
        tokenAddress: bridgeInfo[l1ChainId].tokenAddress!,
      }),
    )
  // OFT peers can't be tunneled, so they get no bridgeInfo back to Hemi
  const peers = token.extensions?.oft?.peers ?? {}
  const peerTokens = Object.keys(peers)
    .filter(
      chainId =>
        Number(chainId) === sourceChainIds[token.chainId] &&
        bridgeInfo[chainId] === undefined,
    )
    .map(chainId =>
      createRemoteToken({
        chainId,
        extensions: {
          allowanceSlot: peers[chainId].allowanceSlot,
          oft: {
            peers: {
              [token.chainId]: { tokenAddress: token.address as Address },
            },
          },
        },
        token,
        tokenAddress: peers[chainId].tokenAddress!,
      }),
    )
  return bridgedTokens.concat(peerTokens) as EvmToken[]
}

const applyDisplayOverrides = (token: EvmToken) => ({
  ...token,
  ...displayOverrides[token.chainId]?.[token.address],
})

const hemiTokens: EvmToken[] = (hemilabsTokenList.tokens as EvmToken[])
  .filter(t => t.chainId === hemiMainnet.id || t.chainId === hemiTestnet.id)
  .map(applyDisplayOverrides)

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
