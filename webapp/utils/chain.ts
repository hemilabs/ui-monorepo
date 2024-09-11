import { allNetworks } from 'networks'
import { type EvmChain, type RemoteChain } from 'types/chain'

export const findChainById = (chainId: RemoteChain['id']) =>
  allNetworks.find(n => n.id === chainId)

export const isEvmNetwork = (chain: RemoteChain): chain is EvmChain =>
  typeof chain.id === 'number'
