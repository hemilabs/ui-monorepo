import { type Chain } from 'viem'
import { defineChain } from 'viem/utils'

export const overrideRpcUrl = function (chain: Chain, rpcUrl?: string) {
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
