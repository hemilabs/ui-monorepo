import { useMemo } from 'react'
import { tokenList } from 'tokenList'
import { RemoteChain } from 'types/chain'
import { Token } from 'types/token'
import { isTunnelToken } from 'utils/token'

import { useUserTokenList } from './useUserTokenList'

// Some tokens use a custom token symbol only for the tunnel. Replace that here.
const replaceSymbol = (token: Token) =>
  token.extensions?.tunnelSymbol
    ? { ...token, symbol: token.extensions.tunnelSymbol }
    : token

export const useTunnelTokens = function (chainId?: RemoteChain['id']) {
  const { userTokenList } = useUserTokenList()
  return useMemo(
    () =>
      tokenList.tokens
        .filter(isTunnelToken)
        .map(replaceSymbol)
        // custom user list is added through the tunnel, so by definition all tokens can be tunneled.
        .concat(userTokenList)
        .filter(t => !chainId || t.chainId === chainId),
    [chainId, userTokenList],
  )
}
