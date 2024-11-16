import { tokenList } from 'tokenList'
import { RemoteChain } from 'types/chain'

import { useUserTokenList } from './useUserTokenList'

export const useTokenList = function (chainId?: RemoteChain['id']) {
  const { userTokenList } = useUserTokenList()
  return tokenList.tokens
    .concat(userTokenList.tokens)
    .filter(t => !chainId || t.chainId === chainId)
}
