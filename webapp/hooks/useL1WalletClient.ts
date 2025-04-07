import { Chain } from 'viem'
import { useWalletClient } from 'wagmi'

export const useL1WalletClient = function (chainId: Chain['id']) {
  const { data: l1WalletClient, ...rest } = useWalletClient({
    chainId,
  })

  return {
    l1WalletClient,
    ...rest,
  }
}
