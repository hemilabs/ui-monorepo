import { useMemo } from 'react'
import { tokenList } from 'tokenList'
import { RemoteChain } from 'types/chain'
import { isTunnelToken } from 'utils/token'

import { useUserTokenList } from './useUserTokenList'

export const useTunnelTokens = function (chainId?: RemoteChain['id']) {
  const { userTokenList } = useUserTokenList()
  return useMemo(
    () =>
      tokenList.tokens
        .filter(isTunnelToken)
        // custom user list is added through the tunnel, so by definition all tokens can be tunneled.
        .concat(userTokenList)
        .filter(t => !chainId || t.chainId === chainId),
    [chainId, userTokenList],
  )
}
