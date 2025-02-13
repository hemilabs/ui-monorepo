import { tokenList } from 'app/tokenList'
import { useMemo } from 'react'
import { isStakeEnabledOnTestnet } from 'utils/stake'
import { isStakeToken } from 'utils/token'

import { useHemi } from './useHemi'
import { useNetworkType } from './useNetworkType'

export const useStakeTokens = function () {
  const [networkType] = useNetworkType()
  const { id, testnet } = useHemi()

  const stakeEnabledTestnet = isStakeEnabledOnTestnet(networkType)

  return useMemo(
    () =>
      tokenList.tokens
        .filter(isStakeToken)
        .filter(t => t.chainId === id && (!testnet || stakeEnabledTestnet)),
    [id, stakeEnabledTestnet, testnet],
  )
}
