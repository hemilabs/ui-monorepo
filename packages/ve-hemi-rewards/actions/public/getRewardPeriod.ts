import {
  getAddress as toChecksumAddress,
  isAddress,
  type Address,
  type Client,
} from 'viem'
import { readContract } from 'viem/actions'

import { veHemiRewardsAbi } from '../../abi.ts'
import { getVeHemiRewardsContractAddress } from '../../constants.ts'

export const getRewardPeriod = async function (
  client: Client,
  { timestamp, tokenAddress }: { tokenAddress: Address; timestamp: number },
) {
  if (!client) {
    throw new Error('Client is not defined')
  }
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }
  if (!isAddress(tokenAddress)) {
    throw new Error('Invalid token address')
  }
  if (!Number.isSafeInteger(timestamp) || timestamp < 0) {
    throw new Error('Invalid timestamp')
  }

  const veHemiRewardsAddress = getVeHemiRewardsContractAddress(client.chain.id)

  return readContract(client, {
    abi: veHemiRewardsAbi,
    address: veHemiRewardsAddress,
    args: [toChecksumAddress(tokenAddress), BigInt(timestamp)],
    functionName: 'rewardPeriods',
  })
}
