import type { Address, Client } from 'viem'
import { isAddress } from 'viem'
import { readContract } from 'viem/actions'

import { yieldVaultAbi } from '../../abi'
import { getBtcStakingVaultContractAddress } from '../../constants'

export const getStrategyConfig = async function (
  client: Client,
  { address }: { address: Address },
) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  if (!isAddress(address)) {
    throw new Error('Strategy address is not a valid address')
  }

  const vaultAddress = getBtcStakingVaultContractAddress(client.chain.id)

  const strategyConfig = await readContract(client, {
    abi: yieldVaultAbi,
    address: vaultAddress,
    args: [address],
    functionName: 'getStrategyConfig',
  })

  return strategyConfig
}
