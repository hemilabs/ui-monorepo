import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { useEstimator } from '../_context/estimatorContext'

export const useNeedsWallet = function () {
  const { scope } = useEstimator()
  const { status } = useAccount()

  return scope === 'with-my-positions' && !walletIsConnected(status)
}
