import { featureFlags } from 'app/featureFlags'
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
    // TODO bitcoin is only enabled for testnet https://github.com/hemilabs/ui-monorepo/issues/738
    () =>
      evmNetworks.concat(
        // @ts-expect-error .concat() automatically casts the result type to evmNetworks' type.
        featureFlags.btcTunnelEnabled && type === 'testnet' ? [bitcoin] : [],
      ),
    [bitcoin, evmNetworks, type],
  )

  // All enabled networks that can tunnel to/from Hemi
  const remoteNetworks: RemoteChain[] = useMemo(
    // TODO bitcoin is only enabled for testnet https://github.com/hemilabs/ui-monorepo/issues/738
    () =>
      evmRemoteNetworks.concat(
        // @ts-expect-error .concat() automatically casts the result type to evmNetworks' type.
        featureFlags.btcTunnelEnabled && type === 'testnet' ? [bitcoin] : [],
      ),
    [bitcoin, evmRemoteNetworks, type],
  )

  return {
    evmNetworks,
    evmRemoteNetworks,
    networks,
    remoteNetworks,
  }
}
