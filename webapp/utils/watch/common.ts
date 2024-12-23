import { publicClientToHemiClient } from 'hooks/useHemiClient'
import pMemoize from 'promise-mem'
import { findChainById } from 'utils/chain'
import { Chain, createPublicClient, http } from 'viem'

export const getHemiClient = pMemoize(async function (chainId: Chain['id']) {
  // L2 are always EVM
  const l2Chain = findChainById(chainId) as Chain
  const publicClient = createPublicClient({
    chain: l2Chain,
    transport: http(),
  })
  return publicClientToHemiClient(publicClient)
})
