import { tokenList } from 'app/tokenList'
import { useMemo } from 'react'
import { StakeToken } from 'types/stake'
import { isStakeEnabledOnTestnet } from 'utils/stake'
import { isStakeToken } from 'utils/token'

import { useHemi } from './useHemi'
import { useNetworkType } from './useNetworkType'

// Some tokens use a custom token symbol only for the stake. Replace that here.
const replaceSymbol = (token: StakeToken) =>
  token.extensions?.stakeSymbol
    ? { ...token, symbol: token.extensions.stakeSymbol }
    : token

export const useStakeTokens = function () {
  const [networkType] = useNetworkType()
  const { id, testnet } = useHemi()

  const stakeEnabledTestnet = isStakeEnabledOnTestnet(networkType)

  return useMemo(
    () =>
      tokenList.tokens
        .filter(isStakeToken)
        .filter(t => t.chainId === id && (!testnet || stakeEnabledTestnet))
        .map(replaceSymbol),
    [id, stakeEnabledTestnet, testnet],
  )
}
