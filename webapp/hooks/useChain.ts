import { type RemoteChain } from 'app/networks'
import { useConfig as useBtcConfig } from 'btc-wallet/hooks/useConfig'
import { useChains as useEvmChains } from 'wagmi'

export const useChain = function (chainId: RemoteChain['id']) {
  const { chains: btcChains } = useBtcConfig()
  const evmChains = useEvmChains()
  if (typeof chainId === 'number') {
    return evmChains.find(chain => chain.id === chainId)
  }
  return btcChains.find(chain => chain.id === chainId)
}
