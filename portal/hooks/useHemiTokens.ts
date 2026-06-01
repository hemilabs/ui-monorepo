import { useMemo } from 'react'
import { tokenList } from 'tokenList'
import { EvmToken } from 'types/token'
import { isEvmToken } from 'utils/token'

import { useHemi } from './useHemi'

export const useHemiTokens = function () {
  const hemi = useHemi()

  return useMemo(
    () =>
      tokenList.tokens.filter(
        (token): token is EvmToken =>
          isEvmToken(token) && token.chainId === hemi.id,
      ),
    [hemi.id],
  )
}
