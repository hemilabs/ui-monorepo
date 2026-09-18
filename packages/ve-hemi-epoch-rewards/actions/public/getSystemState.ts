import { type Client } from 'viem'
import { readContract } from 'viem/actions'

import { getVeHemiEpochRewardsLensContractAddress } from '../../constants.ts'
import { veHemiEpochRewardsLensAbi } from '../../lensAbi.ts'

export const getSystemState = async function (client: Client) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const lensAddress = getVeHemiEpochRewardsLensContractAddress(client.chain.id)

  return readContract(client, {
    abi: veHemiEpochRewardsLensAbi,
    address: lensAddress,
    functionName: 'systemState',
  })
}
