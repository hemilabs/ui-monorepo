import { featureFlags } from 'app/featureFlags'
import { tokenList as baseTokenList } from 'token-list'

export const tokenList = {
  ...baseTokenList,
  tokens: baseTokenList.tokens
    // WETH is not visible in the whole portal
    .filter(t => t.symbol !== 'WETH')
    // TODO Remove the following line once bitcoin is enabled https://github.com/hemilabs/ui-monorepo/issues/738
    .filter(
      t =>
        (t.symbol !== 'hemiBTC' && t.symbol !== 'tBTC' && t.symbol !== 'BTC') ||
        featureFlags.btcTunnelEnabled,
    ),
}
