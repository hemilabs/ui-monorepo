import { featureFlags } from 'app/featureFlags'
import { useAccounts } from 'hooks/useAccounts'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { type RemoteChain } from 'types/chain'
import { isBtcNetworkId } from 'utils/chain'

export const useToastIfNotConnectedTo = function (
  expectedChainId: RemoteChain['id'],
) {
  const { btcChainId, evmChainId } = useAccounts()

  const isConnectedToExpectedNetwork =
    useIsConnectedToExpectedNetwork(expectedChainId)

  const tunnelingFromOrToBtc = isBtcNetworkId(expectedChainId)

  if (tunnelingFromOrToBtc && featureFlags.btcTunnelEnabled) {
    const connected = btcChainId !== undefined
    return connected && !isConnectedToExpectedNetwork
  }

  const connected = evmChainId !== undefined
  return connected && !isConnectedToExpectedNetwork
}
