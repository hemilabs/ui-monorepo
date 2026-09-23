import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { walletIsConnected } from 'utils/wallet'

import { useNetworks } from './useNetworks'

export const useConnectedToUnsupportedBtcChain = function () {
  const { chainId, status } = useBtcAccount()
  const { networks } = useNetworks()
  return walletIsConnected(status) && !networks.some(n => n.id === chainId)
}
