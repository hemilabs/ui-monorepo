import { type Chain as ViemChain } from 'viem'
import { defineChain } from 'viem/utils'

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
