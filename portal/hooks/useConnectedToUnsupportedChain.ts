import { useAccount } from 'wagmi'

export const useConnectedToUnsupportedChain = function () {
  // if connected to unsupported network, "chain" is undefined
  const { chain, status } = useAccount()
  return status === 'connected' && chain === undefined
}
