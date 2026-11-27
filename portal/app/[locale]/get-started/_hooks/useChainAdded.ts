import useLocalStorageState from 'use-local-storage-state'
import { Chain } from 'viem'
import { useAccount } from 'wagmi'

import { getChainAddedStorageKey } from '../_utils/getChainAddedStorageKey'

export const useChainAdded = function (chain: Chain) {
  const { address, connector } = useAccount()
  return useLocalStorageState(
    getChainAddedStorageKey({
      address,
      chainId: chain.id,
      connectorId: connector?.id,
    }),
    {
      defaultValue: false,
    },
  )
}
