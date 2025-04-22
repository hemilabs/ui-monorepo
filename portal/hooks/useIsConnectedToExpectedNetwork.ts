import { type RemoteChain } from 'types/chain'

import { useAccounts } from './useAccounts'

export const useIsConnectedToExpectedNetwork = function (
  expectedChainId: RemoteChain['id'],
) {
  const { btcChainId, evmChainId } = useAccounts()
  return btcChainId === expectedChainId || evmChainId === expectedChainId
}
