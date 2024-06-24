import { featureFlags } from 'app/featureFlags'
import { RemoteChain } from 'app/networks'

import { useAccounts } from './useAccounts'

export const useIsConnectedToExpectedNetwork = function (
  expectedChainId: RemoteChain['id'],
) {
  const { btcChainId, evmChainId } = useAccounts()
  return (
    (featureFlags.btcTunnelEnabled && btcChainId === expectedChainId) ||
    evmChainId === expectedChainId
  )
}
