import { featureFlags } from 'app/featureFlags'
import { type RemoteChain } from 'types/chain'

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
