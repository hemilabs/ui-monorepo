import { type Chain } from 'viem'
import { useNetwork } from 'wagmi'

export const useIsConnectedToExpectedNetwork = function (
  expectedChainId: Chain['id'],
) {
  const { chain } = useNetwork()
  return chain?.id === expectedChainId
}
