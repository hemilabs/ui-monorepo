import hemilabsTokenList from '@hemilabs/token-list'
import { type BtcChain } from 'btc-wallet/chains'
import { hemi as hemiMainnet, hemiSepolia as hemiTestnet } from 'hemi-viem'
import { type Address } from 'viem'

import { customTunnelPartnersWhitelist } from './customTunnelPartnersWhitelist'
import { nativeTokens } from './nativeTokens'
import { stakeWhiteList } from './stakeTokens'
import { tunnelWhiteList } from './tunnelTokens'
import { type Extensions, type Token } from './types'

const extendWithWhiteList = <
  T extends Partial<Record<Token['chainId'], Record<string, Extensions>>>,
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

export const getRemoteTokens = function (token: Token) {
  if (!token.extensions?.bridgeInfo) {
    return [] satisfies Token[]
  }
  return Object.keys(token.extensions!.bridgeInfo!).map(l1ChainId => ({
    ...token,
    address: token.extensions!.bridgeInfo![l1ChainId].tokenAddress,
    // @ts-expect-error isNaN also accepts strings!
    chainId: isNaN(l1ChainId)
      ? (l1ChainId as BtcChain['id'])
      : Number(l1ChainId),
    extensions: {
      bridgeInfo: {
        [token.chainId]: {
          tokenAddress: token.address as Address,
        },
      },
    },
    name: token.name
      // Remove the ".e" suffix
      .replace('.e', '')
      .trim(),
    symbol: token.symbol
      // Remove the ".e" suffix
      .replace('.e', '')
      .trim(),
  })) as Token[]
}

const hemiTokens = hemilabsTokenList.tokens
  .filter(t => t.chainId === hemiMainnet.id || t.chainId === hemiTestnet.id)
  .map(t => ({ ...t, symbol: t.symbol.replace('.e', '').trim() })) as Token[]

// the hemiTokens only contains definitions for Hemi tokens, but we can create the L1 version with the extensions field info
const tokens: Token[] = hemiTokens.concat(hemiTokens.flatMap(getRemoteTokens))

export const tokenList = {
  name: hemilabsTokenList.name,
  tags: {},
  timestamp: hemilabsTokenList.timestamp,
  tokens: tokens
    .concat(nativeTokens)
    .map(extendWithWhiteList(stakeWhiteList))
    .map(extendWithWhiteList(tunnelWhiteList))
    .map(extendWithWhiteList(customTunnelPartnersWhitelist))
    .sort((a, b) => a.symbol.localeCompare(b.symbol)),
}
