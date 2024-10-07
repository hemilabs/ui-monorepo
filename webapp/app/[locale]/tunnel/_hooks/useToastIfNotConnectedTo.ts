import { useAccounts } from 'hooks/useAccounts'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { RemoteChain } from 'types/chain'

export const useToastIfNotConnectedTo = function (
  expectedChainId: RemoteChain['id'],
) {
  const { btcChainId, evmChainId } = useAccounts()

  const isConnectedToExpectedNetwork =
    useIsConnectedToExpectedNetwork(expectedChainId)

  // status has different internal status to account for. If "chainId" is undefined, it is disconnected.
  // If defined, it is connected to anything (status may go through to reconnecting, which would briefly
  // show the notification box)
  const disconnected = btcChainId === undefined && evmChainId === undefined
  return !disconnected && !isConnectedToExpectedNetwork
}
