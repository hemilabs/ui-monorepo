import { allNetworks } from 'networks'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { type EvmChain, type RemoteChain } from 'types/chain'
import { type Chain } from 'viem'

export const findChainById = (chainId: RemoteChain['id']) =>
  allNetworks.find(n => n.id === chainId)

export const isBtcNetworkId = (chainId: RemoteChain['id']) =>
  typeof chainId === 'string'

export const isEvmNetworkId = (chainId: RemoteChain['id']) =>
  typeof chainId === 'number'

export const isEvmNetwork = (chain: RemoteChain): chain is EvmChain =>
  isEvmNetworkId(chain.id)

export const isL2NetworkId = (chainId: number) =>
  [hemiMainnet.id, hemiTestnet.id].includes(chainId)

export const isL2Network = (chain: Chain) => isL2NetworkId(chain.id)
