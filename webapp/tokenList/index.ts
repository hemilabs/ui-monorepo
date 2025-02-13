import hemilabsTokenList from '@hemilabs/token-list'
import { featureFlags } from 'app/featureFlags'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { type RemoteChain } from 'types/chain'
import { type EvmToken, type Token } from 'types/token'
import { type Address } from 'viem'

import { customTunnelPartnersWhitelist } from './customTunnelPartnersWhitelist'
import { nativeTokens } from './nativeTokens'
import { stakeWhiteList } from './stakeTokens'
import { tunnelWhiteList } from './tunnelTokens'

export const extendWithWhiteList = <
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

export const getRemoteTokens = function (token: EvmToken) {
  if (!token.extensions?.bridgeInfo) {
    return [] satisfies EvmToken[]
  }
  return Object.keys(token.extensions!.bridgeInfo!).map(l1ChainId => ({
    ...token,
    address: token.extensions!.bridgeInfo![l1ChainId].tokenAddress,
    chainId: Number(l1ChainId),
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
  })) satisfies EvmToken[]
}

const hemiTokens: Token[] = (hemilabsTokenList.tokens as EvmToken[])
  .filter(t => t.chainId === hemiMainnet.id || t.chainId === hemiTestnet.id)
  // WETH cannot be tunneled, so we must exclude it
  .filter(t => t.symbol !== 'WETH')
  // TODO the following line once bitcoin is enabled https://github.com/hemilabs/ui-monorepo/issues/738
  .filter(t => t.symbol !== 'tBTC' || featureFlags.btcTunnelEnabled)
  .map(t => ({ ...t, symbol: t.symbol.replace('.e', '').trim() }))

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
