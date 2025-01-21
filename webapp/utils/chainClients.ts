import { publicClientToHemiClient } from 'hooks/useHemiClient'
import { findChainById } from 'utils/chain'
import { buildTransport } from 'utils/transport'
import { Chain, createPublicClient } from 'viem'

export const getHemiClient = function (chainId: Chain['id']) {
  // L2 are always EVM
  const l2Chain = findChainById(chainId) as Chain
  const publicClient = createPublicClient({
    chain: l2Chain,
    transport: buildTransport(l2Chain),
  })
  return publicClientToHemiClient(publicClient)
}
