import { findChainById } from 'utils/chain'
import { buildTransport } from 'utils/transport'
import { type Chain, createPublicClient, type PublicClient } from 'viem'
import { publicActionsL1, PublicActionsL1 } from 'viem/op-stack'

export const getPublicClient = function (chainId: Chain['id']) {
  const chain = findChainById(chainId) as Chain
  return createPublicClient({
    chain,
    transport: buildTransport(chain),
  })
}

export const getEvmL1PublicClient = function (chainId: Chain['id']) {
  const l1Chain = findChainById(chainId) as Chain
  return createPublicClient({
    chain: l1Chain,
    transport: buildTransport(l1Chain),
  }).extend(publicActionsL1()) as PublicClient & PublicActionsL1
}
