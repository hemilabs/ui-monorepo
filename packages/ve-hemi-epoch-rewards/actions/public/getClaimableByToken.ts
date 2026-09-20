import { isAddress, type Address, type Client } from 'viem'
import { readContract } from 'viem/actions'

import { getVeHemiEpochRewardsLensContractAddress } from '../../constants.ts'
import { veHemiEpochRewardsLensAbi } from '../../lensAbi.ts'

const isEpoch = (epoch: number) => Number.isSafeInteger(epoch) && epoch >= 0

export const getClaimableByToken = async function (
  client: Client,
  options: {
    fromEpoch: number
    holder: Address
    toEpoch: number
    tokenId: bigint
  },
) {
  const { fromEpoch, holder, toEpoch, tokenId } = options ?? {}

  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }
  if (!isAddress(holder)) {
    throw new Error('Invalid holder address')
  }
  if (!isEpoch(fromEpoch) || !isEpoch(toEpoch)) {
    throw new Error('Invalid epoch')
  }
  if (fromEpoch > toEpoch) {
    throw new Error('Invalid epoch range')
  }

  const lensAddress = getVeHemiEpochRewardsLensContractAddress(client.chain.id)

  return readContract(client, {
    abi: veHemiEpochRewardsLensAbi,
    address: lensAddress,
    args: [tokenId, holder, fromEpoch, toEpoch],
    functionName: 'claimableByToken',
  })
}
