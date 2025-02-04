import { useMemo } from 'react'
import { tokenList } from 'tokenList'
import { StakeToken } from 'types/stake'
import { isStakeEnabledOnTestnet } from 'utils/stake'
import { isStakeToken } from 'utils/token'

import { useHemi } from './useHemi'
import { useNetworkType } from './useNetworkType'

// TODO: It's pending to implement some missing badges
// Issue #799 https://github.com/hemilabs/ui-monorepo/issues/799
const tokenRewardMap: Record<
  StakeToken['symbol'],
  StakeToken['extensions']['rewards']
> = {
  'enzoBTC': ['hemi'],
  'iBTC': ['hemi'],
  'M-BTC': ['hemi'],
  'oBTC': ['hemi'],
  'pumpBTC': ['hemi'],
  'stBTC': ['hemi'],
  'uBTC': ['hemi'],
}

export const useStakeTokens = function () {
  const [networkType] = useNetworkType()
  const { id, testnet } = useHemi()

  const stakeEnabledTestnet = isStakeEnabledOnTestnet(networkType)

  return useMemo(
    () =>
      tokenList.tokens
        .filter(isStakeToken)
        .filter(t => t.chainId === id && (!testnet || stakeEnabledTestnet))
        .map(token => ({
          ...token,
          extensions: {
            ...token.extensions,
            rewards: tokenRewardMap[token.symbol] || [],
          },
        })),
    [id, stakeEnabledTestnet, testnet],
  )
}
