import {
  isAddress,
  isAddressEqual,
  zeroAddress,
  type Address,
  type Client,
} from 'viem'
import { multicall } from 'viem/actions'

import { getVeHemiEpochRewardsLensContractAddress } from '../../constants.ts'
import { veHemiEpochRewardsLensAbi } from '../../lensAbi.ts'
import { isEpoch } from '../../utils.ts'

export const getEpochFunding = async function (
  client: Client,
  {
    fromEpoch,
    toEpoch,
    tokens,
  }: { fromEpoch: number; toEpoch: number; tokens: readonly Address[] },
) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }
  if (
    tokens.some(
      token => !isAddress(token) || isAddressEqual(token, zeroAddress),
    )
  ) {
    throw new Error('Invalid token address')
  }
  if (!isEpoch(fromEpoch)) {
    throw new Error('Invalid fromEpoch')
  }
  if (!isEpoch(toEpoch)) {
    throw new Error('Invalid toEpoch')
  }
  if (fromEpoch > toEpoch) {
    throw new Error('Invalid epoch range')
  }

  const lensAddress = getVeHemiEpochRewardsLensContractAddress(client.chain.id)

  const results = await multicall(client, {
    allowFailure: false,
    contracts: tokens.map(
      token =>
        ({
          abi: veHemiEpochRewardsLensAbi,
          address: lensAddress,
          args: [token, fromEpoch, toEpoch],
          functionName: 'epochFunding',
        }) as const,
    ),
  })

  return results.map(([epochs, funded, claimed, swept], i) => ({
    claimed,
    epochs,
    funded,
    swept,
    token: tokens[i],
  }))
}
