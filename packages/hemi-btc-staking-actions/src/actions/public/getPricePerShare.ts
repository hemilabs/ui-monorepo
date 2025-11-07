import type { Client } from 'viem'
import { readContract } from 'viem/actions'

import { yieldVaultAbi } from '../../abi'
import { getBtcStakingVaultContractAddress } from '../../constants'

export const getPricePerShare = async function ({
  client,
}: {
  client: Client
}) {
  if (!client.chain) {
    throw new Error('Public client chain is not defined')
  }

  const vaultAddress = getBtcStakingVaultContractAddress(client.chain.id)

  return readContract(client, {
    abi: yieldVaultAbi,
    address: vaultAddress,
    functionName: 'pricePerShare',
  })
}
