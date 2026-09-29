import {
  isAddress,
  isAddressEqual,
  zeroAddress,
  type Address,
  type Client,
} from 'viem'
import { readContract } from 'viem/actions'

import { getVeHemiEpochRewardsLensContractAddress } from '../../constants.ts'
import { veHemiEpochRewardsLensAbi } from '../../lensAbi.ts'
import { isEpoch } from '../../utils.ts'

export const getEpochStreams = async function (
  client: Client,
  { epoch, token }: { epoch: number; token: Address },
) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }
  if (!isAddress(token) || isAddressEqual(token, zeroAddress)) {
    throw new Error('Invalid token address')
  }
  if (!isEpoch(epoch)) {
    throw new Error('Invalid epoch')
  }

  const lensAddress = getVeHemiEpochRewardsLensContractAddress(client.chain.id)

  const streams = await readContract(client, {
    abi: veHemiEpochRewardsLensAbi,
    address: lensAddress,
    args: [epoch, token],
    functionName: 'streamsForEpoch',
  })

  return streams.filter(stream => isAddressEqual(stream.token, token))
}
