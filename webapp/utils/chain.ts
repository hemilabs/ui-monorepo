import { allNetworks } from 'networks'
import { type EvmChain, type RemoteChain } from 'types/chain'
import { type Chain as ViemChain } from 'viem'
import { defineChain } from 'viem/utils'

export const findChainById = (chainId: RemoteChain['id']) =>
  allNetworks.find(n => n.id === chainId)

export const isEvmNetwork = (chain: RemoteChain): chain is EvmChain =>
  typeof chain.id === 'number'

export const overrideRpcUrl = function (chain: ViemChain, rpcUrl?: string) {
  const isValidCustomSepoliaRpc = !!rpcUrl && rpcUrl.startsWith('https')
  if (isValidCustomSepoliaRpc) {
    return defineChain({
      ...chain,
      rpcUrls: {
        default: {
          http: [rpcUrl],
        },
      },
    })
  }
  return chain
}
