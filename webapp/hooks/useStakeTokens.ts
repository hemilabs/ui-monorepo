import { useMemo } from 'react'
import { tokenList } from 'tokenList'
import { isStakeToken } from 'utils/token'

import { useHemi } from './useHemi'

export const useStakeTokens = function () {
  const hemiId = useHemi().id
  return useMemo(
    () =>
      tokenList.tokens.filter(isStakeToken).filter(t => t.chainId === hemiId),
    [hemiId],
  )
}
