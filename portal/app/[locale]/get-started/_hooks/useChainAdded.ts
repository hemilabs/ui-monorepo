import useLocalStorageState from 'use-local-storage-state'
import { Chain } from 'viem'

export const useChainAdded = (chain: Chain) =>
  useLocalStorageState(
    `portal.get-started.configure-networks-added-${chain.id}`,
    {
      defaultValue: false,
    },
  )
