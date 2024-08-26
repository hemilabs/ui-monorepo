'use client'

import { featureFlags } from 'app/featureFlags'
import { bitcoinTestnet, bitcoinMainnet } from 'btc-wallet/chains'
import { hemi as hemiMainnet, hemiSepolia as hemiTestnet } from 'hemi-viem'
import { type OrderedChains, type RemoteChain } from 'types/chain'
import { mainnet, sepolia } from 'wagmi/chains'

export const testnetEvmRemoteNetworks: OrderedChains = [sepolia]
export const mainnetEvmRemoteNetworks: OrderedChains = [mainnet]

// Use these lists only for providers needed outside of the UI
// for example in workers threads, as it mixes
// mainnet and testnet chains
// this way, we don't need to forward the network type
// in those contexts where it would make it complicated
export const allEvmNetworks: OrderedChains = [
  hemiMainnet,
  hemiTestnet,
  ...testnetEvmRemoteNetworks,
  ...mainnetEvmRemoteNetworks,
]

export const allNetworks: RemoteChain[] = allEvmNetworks.concat(
  //@ts-expect-error .concat() automatically casts the result type to evmNetworks' type.
  featureFlags.btcTunnelEnabled ? [bitcoinTestnet, bitcoinMainnet] : [],
)
