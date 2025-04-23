import { useAccount } from 'wagmi'

import { useConnectedToUnsupportedEvmChain } from './useConnectedToUnsupportedChain'

export const useConnectedToSupportedEvmChain = function () {
  const { isConnected } = useAccount()
  const unsupported = useConnectedToUnsupportedEvmChain()
  return isConnected && !unsupported
}
