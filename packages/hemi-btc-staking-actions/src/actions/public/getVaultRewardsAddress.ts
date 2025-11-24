import type { Client } from 'viem'
import { readContract } from 'viem/actions'

import { yieldVaultAbi } from '../../abi'
import { getBtcStakingVaultContractAddress } from '../../constants'

export const getVaultRewardsAddress = async function (client: Client) {
  if (!client) {
    throw new Error('Client is required')
  }

  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const vaultAddress = getBtcStakingVaultContractAddress(client.chain.id)

  return readContract(client, {
    abi: yieldVaultAbi,
    address: vaultAddress,
    functionName: 'vaultRewards',
  })
}
