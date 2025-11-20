import type { Client } from 'viem'
import { readContract } from 'viem/actions'

import { yieldVaultAbi } from '../../abi'
import { getBtcStakingVaultContractAddress } from '../../constants'

export const getStrategies = async function (client: Client) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const vaultAddress = getBtcStakingVaultContractAddress(client.chain.id)

  // Returns an empty array if there are no strategies
  return readContract(client, {
    abi: yieldVaultAbi,
    address: vaultAddress,
    functionName: 'getStrategies',
  })
}
