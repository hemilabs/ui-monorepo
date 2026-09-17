import type { Client } from 'viem'
import { readContract } from 'viem/actions'

import { veHemiAbi } from '../../abi.ts'
import { getVeHemiContractAddress } from '../../constants.ts'

export const getTotalLocked = async function (client: Client) {
  if (!client) {
    throw new Error('Client is not defined')
  }
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  return readContract(client, {
    abi: veHemiAbi,
    address: getVeHemiContractAddress(client.chain.id),
    functionName: 'totalLocked',
  })
}
