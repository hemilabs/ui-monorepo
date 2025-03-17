import { mainnetEvmRemoteNetworks, testnetEvmRemoteNetworks } from 'networks'
import { useMemo } from 'react'
import { type OrderedChains, RemoteChain } from 'types/chain'

import { useBitcoin } from './useBitcoin'
import { useHemi } from './useHemi'
import { useNetworkType } from './useNetworkType'

export const useNetworks = function () {
  const bitcoin = useBitcoin()
  const hemi = useHemi()
  const [type] = useNetworkType()

  // All EVM-compatible enabled networks that can tunnel to/from Hemi
  const evmRemoteNetworks = useMemo(
    () =>
      type === 'testnet' ? testnetEvmRemoteNetworks : mainnetEvmRemoteNetworks,
    [type],
  )

  // All EVM-compatible enabled networks
  const evmNetworks: OrderedChains = useMemo(
    () => [hemi, ...evmRemoteNetworks],
    [hemi, evmRemoteNetworks],
  )

  // All enabled networks
  const networks: RemoteChain[] = useMemo(
    () =>
      evmNetworks.concat(
        // @ts-expect-error .concat() automatically casts the result type to evmNetworks' type.
        [bitcoin],
      ),
    [bitcoin, evmNetworks],
  )

  // All enabled networks that can tunnel to/from Hemi
  const remoteNetworks: RemoteChain[] = useMemo(
    () =>
      evmRemoteNetworks.concat(
        // @ts-expect-error .concat() automatically casts the result type to evmNetworks' type.
        [bitcoin],
      ),
    [bitcoin, evmRemoteNetworks],
  )

  return {
    evmNetworks,
    evmRemoteNetworks,
    networks,
    remoteNetworks,
  }
}
