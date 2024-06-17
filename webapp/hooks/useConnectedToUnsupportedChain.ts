import { useAccount } from 'wagmi'

export const useConnectedToUnsupportedEvmChain = function () {
  // if connected to unsupported network, "chain" is undefined
  const { chain, status } = useAccount()
  return status === 'connected' && chain === undefined
}
