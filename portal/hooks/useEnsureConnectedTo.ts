import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { type RemoteChain } from 'types/chain'
import { isBtcNetworkId, isEvmNetworkId } from 'utils/chain'
import { useAccount, useSwitchChain } from 'wagmi'

export const useEnsureConnectedTo = function () {
  const { switchChainAsync } = useSwitchChain()
  const { address: evmAddress, chainId: evmChainId } = useAccount()
  const {
    address: btcAddress,
    chainId: btcChainId,
    connector: btcConnector,
  } = useBtcAccount()

  return async function ensureConnectedTo(targetChainId: RemoteChain['id']) {
    if (isEvmNetworkId(targetChainId)) {
      if (!evmAddress) throw new Error('No EVM account connected')
      if (evmChainId !== targetChainId) {
        await switchChainAsync({ chainId: targetChainId })
      }
      return
    }

    if (isBtcNetworkId(targetChainId)) {
      if (!btcAddress) throw new Error('No Bitcoin wallet connected')
      if (!btcConnector) throw new Error('Bitcoin wallet not connected')
      if (btcChainId !== targetChainId) {
        await btcConnector.switchNetwork(targetChainId)
      }
      return
    }

    throw new Error(`Unsupported chain type: ${targetChainId}`)
  }
}
