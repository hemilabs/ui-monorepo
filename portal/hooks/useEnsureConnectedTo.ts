import { useEnsureConnectedTo as useEnsureConnectedToEvm } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { type RemoteChain } from 'types/chain'
import { isBtcNetworkId, isEvmNetworkId } from 'utils/chain'

/**
 * Ensures the wallet is connected to the target chain (EVM or Bitcoin).
 * Uses @hemilabs/react-hooks for EVM; extends with Bitcoin support locally.
 */
export const useEnsureConnectedTo = function () {
  const ensureConnectedToEvm = useEnsureConnectedToEvm()
  const {
    address: btcAddress,
    chainId: btcChainId,
    connector: btcConnector,
  } = useBtcAccount()

  return async function ensureConnectedTo(targetChainId: RemoteChain['id']) {
    if (isEvmNetworkId(targetChainId)) {
      return ensureConnectedToEvm(targetChainId)
    }

    if (isBtcNetworkId(targetChainId)) {
      if (!btcAddress) throw new Error('No Bitcoin wallet connected')
      if (!btcConnector) throw new Error('Bitcoin wallet not connected')
      if (btcChainId !== targetChainId) {
        await btcConnector.switchNetwork(targetChainId)
      }
      return undefined
    }

    throw new Error(`Unsupported chain type: ${targetChainId}`)
  }
}
