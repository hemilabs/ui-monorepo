import { type Chain } from 'viem'
import { useAccount } from 'wagmi'

export const useIsConnectedToExpectedNetwork = function (
  expectedChainId: Chain['id'],
) {
  const { chain } = useAccount()
  return chain?.id === expectedChainId
}
