import { useMemo } from 'react'
import { getRemoteTokens, tokenList } from 'tokenList'
import { RemoteChain } from 'types/chain'

import { useUserTokenList } from './useUserTokenList'

export const useTokenList = function (chainId?: RemoteChain['id']) {
  const { userTokenList } = useUserTokenList()
  return useMemo(
    () =>
      tokenList.tokens
        .concat(userTokenList.tokens)
        .concat(userTokenList.tokens.flatMap(getRemoteTokens))
        .filter(t => !chainId || t.chainId === chainId),
    [chainId, userTokenList.tokens],
  )
}
