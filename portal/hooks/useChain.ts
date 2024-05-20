import { Chain } from 'viem'
import { useChains } from 'wagmi'

export const useChain = function (chainId: Chain['id']) {
  const chains = useChains()
  return chains.find(chain => chain.id === chainId)
}
