import { tokenList } from 'app/tokenList'
import { useMemo } from 'react'
import { StakeToken } from 'types/stake'
import { isStakeEnabledOnTestnet } from 'utils/stake'
import { isStakeToken } from 'utils/token'

import { useHemi } from './useHemi'
import { useNetworkType } from './useNetworkType'

// TODO: Some tokens are not deployed, so their rewards can't be configured
// https://github.com/hemilabs/ui-monorepo/issues/752#issuecomment-2616916547
const tokenRewardMap: Record<
  StakeToken['symbol'],
  StakeToken['extensions']['rewards']
> = {
  'enzoBTC': ['hemi', 'lorenzo'],
  'iBTC': ['hemi'],
  'M-BTC': ['hemi'],
  'oBTC': ['hemi'],
  'pumpBTC': ['hemi', 'pumpbtc'],
  'stBTC': ['hemi', 'lorenzo'],
  'uBTC': ['hemi', 'unirouter', 'bsquared'],
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
