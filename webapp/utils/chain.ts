import { allNetworks } from 'networks'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { type EvmChain, type RemoteChain } from 'types/chain'
import { type Chain } from 'viem'
import { defineChain } from 'viem/utils'

export const findChainById = (chainId: RemoteChain['id']) =>
  allNetworks.find(n => n.id === chainId)

export const isEvmNetwork = (chain: RemoteChain): chain is EvmChain =>
  typeof chain.id === 'number'

export const isL2NetworkId = (chainId: number) =>
  [hemiMainnet.id, hemiTestnet.id].includes(chainId)

export const isL2Network = (chain: Chain) => isL2NetworkId(chain.id)

export const overrideRpcUrl = function (chain: Chain, rpcUrl?: string) {
  const isValidCustomRpc = !!rpcUrl && rpcUrl.startsWith('https')
  if (isValidCustomRpc) {
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
