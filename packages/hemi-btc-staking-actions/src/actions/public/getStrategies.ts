import type { Client } from 'viem'
import { readContract } from 'viem/actions'

import { yieldVaultAbi } from '../../abi'
import { getBtcStakingVaultContractAddress } from '../../constants'

export const getStrategies = async function ({ client }: { client: Client }) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const vaultAddress = getBtcStakingVaultContractAddress(client.chain.id)

  const strategiesList = await readContract(client, {
    abi: yieldVaultAbi,
    address: vaultAddress,
    functionName: 'getStrategies',
  })

  // TODO check what strategy info is needed
  // See https://github.com/hemilabs/ui-monorepo/issues/1619

  return strategiesList
}
