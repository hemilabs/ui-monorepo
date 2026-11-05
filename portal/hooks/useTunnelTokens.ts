import { useMemo } from 'react'
import { tokenList } from 'tokenList'
import { RemoteChain } from 'types/chain'
import { Token } from 'types/token'
import { isTunnelToken } from 'utils/token'

// Some tokens use a custom token symbol only for the tunnel. Replace that here.
const replaceSymbol = (token: Token) =>
  token.extensions?.tunnelSymbol
    ? { ...token, symbol: token.extensions.tunnelSymbol }
    : token

export const useTunnelTokens = (chainId?: RemoteChain['id']) =>
  useMemo(
    () =>
      tokenList.tokens
        .filter(isTunnelToken)
        .map(replaceSymbol)
        .filter(t => !chainId || t.chainId === chainId),
    [chainId],
  )
