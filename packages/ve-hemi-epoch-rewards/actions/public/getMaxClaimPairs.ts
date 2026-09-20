import { type Client } from 'viem'
import { readContract } from 'viem/actions'

import { getVeHemiEpochRewardsContractAddress } from '../../constants.ts'
import { veHemiEpochRewardsAbi } from '../../rewardsAbi.ts'

export const getMaxClaimPairs = function (client: Client) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  return readContract(client, {
    abi: veHemiEpochRewardsAbi,
    address: getVeHemiEpochRewardsContractAddress(client.chain.id),
    functionName: 'MAX_CLAIM_PAIRS',
  })
}
