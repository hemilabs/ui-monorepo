import { Chain } from 'viem'
import { useAccount, useSwitchChain } from 'wagmi'

export const useEnsureConnectedTo = function () {
  const { switchChainAsync } = useSwitchChain()
  const { address, chainId } = useAccount()

  return async function ensureConnectedTo(targetChainId: Chain['id']) {
    if (!address) {
      throw new Error('No account connected')
    }
    if (targetChainId !== chainId) {
      await switchChainAsync({ chainId: targetChainId })
    }
  }
}
