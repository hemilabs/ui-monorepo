import type { Client } from 'viem'
import { readContract } from 'viem/actions'

import { veHemiAbi } from '../../abi'
import { getVeHemiContractAddress } from '../../constants'

export const getTotalVeHemiSupplyAt = async function (
  client: Client,
  timestamp: number,
) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }
  if (!Number.isSafeInteger(timestamp) || timestamp < 0) {
    throw new Error('Invalid timestamp')
  }

  const veHemiAddress = getVeHemiContractAddress(client.chain.id)

  return readContract(client, {
    abi: veHemiAbi,
    address: veHemiAddress,
    args: [BigInt(timestamp)],
    functionName: 'totalVeHemiSupplyAt',
  })
}
