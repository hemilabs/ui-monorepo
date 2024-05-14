import { type Chain } from 'viem'
import { useAccount } from 'wagmi'

export const useIsConnectedToExpectedNetwork = function (
  expectedChainId: Chain['id'],
) {
  const { chainId } = useAccount()
  return chainId === expectedChainId
}
