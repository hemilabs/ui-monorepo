import { hemi, hemiSepolia } from 'hemi-viem'
import { type Chain, createPublicClient, http, type PublicClient } from 'viem'

const chains: Record<number, Chain> = {
  [hemi.id]: hemi,
  [hemiSepolia.id]: hemiSepolia,
}

export const getHemiClient = function (chainId: number) {
  const chain = chains[chainId]
  if (!chain) {
    throw new Error(`Chain ${chainId} is not a Hemi chain`)
  }
  return createPublicClient({
    chain,
    transport: http(undefined, { batch: true }),
  }) as PublicClient
}
