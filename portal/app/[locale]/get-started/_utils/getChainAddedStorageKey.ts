import { Address } from 'viem'

type ChainAddedStorageKeyParams = {
  address?: Address
  chainId: number
  connectorId?: string
}

export const getChainAddedStorageKey = function ({
  address,
  chainId,
  connectorId,
}: ChainAddedStorageKeyParams) {
  const account = address?.toLowerCase() ?? 'disconnected'
  const wallet = connectorId ?? 'disconnected'
  return `portal.get-started.configure-networks-added:${chainId}:${wallet}:${account}`
}
