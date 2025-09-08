import { RemoteChain } from 'types/chain'

import { useNetworks } from './useNetworks'

export const useChainIsSupported = function (
  chainId: RemoteChain['id'] | undefined,
) {
  const { networks } = useNetworks()
  return networks.some(({ id }) => id === chainId)
}
