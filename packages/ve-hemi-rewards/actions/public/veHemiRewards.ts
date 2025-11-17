import { getAddress, type Address, type Client } from 'viem'
import { readContract } from 'viem/actions'

import { veHemiRewardsAbi } from '../../abi'
import { getVeHemiRewardsContractAddress } from '../../constants'

export const calculateRewards = async function (
  client: Client,
  tokenId: bigint,
  rewardToken: Address,
) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  // Normalize the address to ensure correct checksum
  const normalizedRewardToken = getAddress(rewardToken.toLowerCase())

  const veHemiRewardsAddress = getVeHemiRewardsContractAddress(client.chain.id)

  return readContract(client, {
    abi: veHemiRewardsAbi,
    address: veHemiRewardsAddress,
    args: [tokenId, normalizedRewardToken],
    functionName: 'calculateRewards',
  })
}

export const getRewardTokens = async function (
  client: Client,
): Promise<Address[]> {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const veHemiRewardsAddress = getVeHemiRewardsContractAddress(client.chain.id)

  const numTokens = await readContract(client, {
    abi: veHemiRewardsAbi,
    address: veHemiRewardsAddress,
    functionName: 'numRewardTokens',
  })

  const tokenPromises = Array.from({ length: Number(numTokens) }, (_, i) =>
    readContract(client, {
      abi: veHemiRewardsAbi,
      address: veHemiRewardsAddress,
      args: [BigInt(i)],
      functionName: 'rewardTokens',
    }),
  )

  return Promise.all(tokenPromises)
}
