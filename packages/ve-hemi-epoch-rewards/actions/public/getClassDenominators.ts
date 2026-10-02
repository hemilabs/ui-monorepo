import { type Client } from 'viem'
import { readContract } from 'viem/actions'

import { getVeHemiEpochRewardsContractAddress } from '../../constants.ts'
import { veHemiEpochRewardsAbi } from '../../rewardsAbi.ts'
import { isEpoch } from '../../utils.ts'

export const getClassDenominators = async function (
  client: Client,
  { epoch }: { epoch: number },
) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }
  if (!isEpoch(epoch)) {
    throw new Error('Invalid epoch')
  }

  const [transferable, locked, forfeitable] = await readContract(client, {
    abi: veHemiEpochRewardsAbi,
    address: getVeHemiEpochRewardsContractAddress(client.chain.id),
    args: [epoch],
    functionName: 'classDenominators',
  })

  return { forfeitable, locked, transferable }
}
