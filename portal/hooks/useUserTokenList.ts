import { useMemo } from 'react'
import { getRemoteTokens, normalizeToken } from 'tokenList'
import { type EvmToken } from 'types/token'
import useLocalStorageState from 'use-local-storage-state'
import { type Chain, isAddress, isAddressEqual } from 'viem'

import { useNetworkType } from './useNetworkType'

type CustomTokenList = {
  tokens: EvmToken[]
}

export const useUserTokenList = function (chainId?: Chain['id']) {
  const [networkType] = useNetworkType()
  const [userTokenList, setUserTokenList] =
    useLocalStorageState<CustomTokenList>(
      `portal.custom-token-list-${networkType}`,
      {
        defaultValue: { tokens: [] },
      },
    )
  return useMemo(
    () => ({
      addToken(token: EvmToken) {
        if (!isAddress(token.address, { strict: false })) {
          throw new Error('Invalid token address')
        }
        const normalizedToken = normalizeToken(token)

        setUserTokenList(function (prevList) {
          const found = prevList.tokens.some(
            t =>
              t.chainId === token.chainId &&
              isAddress(t.address) &&
              isAddress(token.address) &&
              isAddressEqual(t.address, token.address),
          )
          if (found) {
            return prevList
          }
          return {
            ...prevList,
            tokens: prevList.tokens.concat(normalizedToken),
          }
        })
      },
      userTokenList: userTokenList.tokens
        .map(normalizeToken)
        .concat(userTokenList.tokens.flatMap(getRemoteTokens))
        .filter(t => !chainId || t.chainId === chainId),
    }),
    [chainId, userTokenList, setUserTokenList],
  )
}
