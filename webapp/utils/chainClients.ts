import { publicClientToHemiClient } from 'hooks/useHemiClient'
import { findChainById } from 'utils/chain'
import { buildTransport } from 'utils/transport'
import { type Chain, createPublicClient, type PublicClient } from 'viem'
import { publicActionsL1, PublicActionsL1 } from 'viem/op-stack'

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

export const getEvmL1PublicClient = function (chainId: Chain['id']) {
  const l1Chain = findChainById(chainId) as Chain
  // @ts-expect-error Fails to infer the types appropriately
  return createPublicClient({
    chain: l1Chain,
    transport: buildTransport(l1Chain),
  }).extend(publicActionsL1()) as PublicClient & PublicActionsL1
}
