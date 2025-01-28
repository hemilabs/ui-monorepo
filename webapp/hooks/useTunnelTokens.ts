import { useMemo } from 'react'
import { tokenList } from 'tokenList'
import { RemoteChain } from 'types/chain'
import { Token } from 'types/token'
import { isStakeToken } from 'utils/token'

import { useUserTokenList } from './useUserTokenList'

// Exclude staking tokens from the tunnel. Currently, there isn't something in the list
// that defines this. So we are just going to exclude tokens that are staking tokens. As these
// are not part of the tunnel. This may change in the future
const tunnelTokens = (token: Token) => !isStakeToken(token)

export const useTunnelTokens = function (chainId?: RemoteChain['id']) {
  const { userTokenList } = useUserTokenList()
  return useMemo(
    () =>
      tokenList.tokens
        .filter(tunnelTokens)
        .concat(userTokenList)
        .filter(t => !chainId || t.chainId === chainId),
    [chainId, userTokenList],
  )
}
