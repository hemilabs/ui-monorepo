import type { Address, PublicClient, WalletClient } from 'viem'
import { readContract } from 'viem/actions'

import { veHemiRewardsAbi } from '../../abi'
import { getVeHemiRewardsContractAddress } from '../../constants'

export const calculateRewards = async function (
  client: PublicClient | WalletClient,
  tokenId: bigint,
  rewardToken: Address,
) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const veHemiRewardsAddress = getVeHemiRewardsContractAddress(client.chain.id)

  return readContract(client, {
    abi: veHemiRewardsAbi,
    address: veHemiRewardsAddress,
    args: [tokenId, rewardToken],
    functionName: 'calculateRewards',
  })
}
