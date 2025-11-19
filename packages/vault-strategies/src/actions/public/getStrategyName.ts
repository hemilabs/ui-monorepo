import type { Address, Client } from 'viem'
import { isAddress } from 'viem'
import { readContract } from 'viem/actions'

import { vaultStrategyAbi } from '../../abi'

export const getStrategyName = function (
  client: Client,
  {
    address,
  }: {
    address: Address
  },
) {
  if (!client) {
    throw new Error('Client is required')
  }

  if (!isAddress(address)) {
    throw new Error('Invalid address provided')
  }

  return readContract(client, {
    abi: vaultStrategyAbi,
    address,
    functionName: 'NAME',
  })
}
