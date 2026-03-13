import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { type RemoteChain } from 'types/chain'

/**
 * Ensures the wallet is connected to the target chain (EVM or Bitcoin).
 * Uses @hemilabs/react-hooks useEnsureConnectedTo for EVM; adds Bitcoin support.
 */
export const useEnsureConnectedToChain = function () {
  const ensureConnectedToEvm = useEnsureConnectedTo()
  const {
    address: btcAddress,
    chainId: btcChainId,
    connector: btcConnector,
  } = useBtcAccount()

  return async function ensureConnectedToChain(
    targetChainId: RemoteChain['id'],
  ) {
    if (typeof targetChainId === 'number') {
      return ensureConnectedToEvm(targetChainId)
    }

    if (typeof targetChainId === 'string') {
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
