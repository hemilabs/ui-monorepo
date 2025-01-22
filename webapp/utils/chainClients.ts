import { publicClientToHemiClient } from 'hooks/useHemiClient'
import { findChainById } from 'utils/chain'
import { buildTransport } from 'utils/transport'
import { type Chain, createPublicClient } from 'viem'

export const getHemiClient = function (chainId: Chain['id']) {
  // L2 are always EVM
  const l2Chain = findChainById(chainId) as Chain
  const publicClient = createPublicClient({
    chain: l2Chain,
    transport: buildTransport(l2Chain),
  })
  // @ts-expect-error Can't make it work. It seems there's some weird inference on the account definition.
  return publicClientToHemiClient(publicClient)
}
