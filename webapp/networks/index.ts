'use client'

import { bitcoinTestnet, bitcoinMainnet } from 'btc-wallet/chains'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { type OrderedChains, type RemoteChain } from 'types/chain'

import { mainnet } from './mainnet'
import { sepolia } from './sepolia'

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

//@ts-expect-error .concat() automatically casts the result type to evmNetworks' type.
export const allNetworks: RemoteChain[] = allEvmNetworks.concat([
  bitcoinTestnet,
  bitcoinMainnet,
])
