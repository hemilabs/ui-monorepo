import { featureFlags } from 'app/featureFlags'
import {
  mainnetEvmRemoteNetworks,
  testnetEvmRemoteNetworks,
} from 'app/networks'
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
    // @ts-expect-error .concat() automatically casts the result type to evmNetworks' type.
    () => evmNetworks.concat(featureFlags.btcTunnelEnabled ? [bitcoin] : []),
    [bitcoin, evmNetworks],
  )

  // All enabled networks that can tunnel to/from Hemi
  const remoteNetworks: RemoteChain[] = useMemo(
    () =>
      // @ts-expect-error .concat() automatically casts the result type to evmNetworks' type.
      evmRemoteNetworks.concat(featureFlags.btcTunnelEnabled ? [bitcoin] : []),
    [bitcoin, evmRemoteNetworks],
  )

  return {
    evmNetworks,
    evmRemoteNetworks,
    networks,
    remoteNetworks,
  }
}
