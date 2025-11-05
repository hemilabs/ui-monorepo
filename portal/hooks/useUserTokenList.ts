import { useMemo } from 'react'
import { getRemoteTokens } from 'tokenList'
import { type EvmToken } from 'types/token'
import useLocalStorageState from 'use-local-storage-state'
import { isAddress, isAddressEqual, checksumAddress } from 'viem'

import { useNetworkType } from './useNetworkType'

type CustomTokenList = {
  tokens: EvmToken[]
}

export const useUserTokenList = function () {
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
        if (!isAddress(token.address)) {
          throw new Error('Invalid token address')
        }

        const normalizedAddress = checksumAddress(token.address, token.chainId)
        const normalizedToken = {
          ...token,
          address: normalizedAddress,
        }
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
      userTokenList: userTokenList.tokens.concat(
        userTokenList.tokens.flatMap(getRemoteTokens),
      ),
    }),
    [userTokenList, setUserTokenList],
  )
}
