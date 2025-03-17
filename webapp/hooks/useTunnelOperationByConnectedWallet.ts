import { isL2NetworkId } from 'utils/chain'

import { useAccounts } from './useAccounts'
import { useBitcoin } from './useBitcoin'
import { useChainIsSupported } from './useChainIsSupported'

/**
 * Returns the appropriate tunnel operation depending on the wallet the user is
 * connected to in the query string object.
 * If the user is connected to an L1, returns "deposit".
 * If the user is connected to an L2, returns "withdraw", unless it is also connected to bitcoin.
 * If the user is connected to an unsupported chain, no query string is returned
 */
export const useTunnelOperationByConnectedWallet = function () {
  const bitcoin = useBitcoin()
  const { btcChainId, evmChainId } = useAccounts()

  const isSupported = useChainIsSupported(evmChainId)

  if (!isSupported) {
    return { pathname: '/tunnel' }
  }

  if (!isL2NetworkId(evmChainId)) {
    return { pathname: '/tunnel', query: { operation: 'deposit' } }
  }
  // here we are connected to hemi.
  // It means that the valid operations are either a withdraw, or a bitcoin deposit (if we're connected to a btc wallet)
  if (bitcoin.id !== btcChainId) {
    return { pathname: '/tunnel', query: { operation: 'withdraw' } }
  }
  return { pathname: '/tunnel', query: { operation: 'deposit' } }
}
