import { type Address, type Client, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'

import { routerAbi } from '../../abi'
import { getHemiEarnRouterAddress } from '../../constants'

export const quoteDeposit = async function ({
  asset,
  assets,
  client,
  fulfillmentFee,
  routerAddress = getHemiEarnRouterAddress(),
}: {
  asset: Address
  assets: bigint
  client: Client
  fulfillmentFee: bigint
  routerAddress?: Address
}): Promise<bigint> {
  if (asset === zeroAddress) {
    throw new Error('quoteDeposit: `asset` cannot be the zero address')
  }
  if (assets <= BigInt(0)) {
    throw new Error('quoteDeposit: `assets` must be greater than zero')
  }
  if (fulfillmentFee < BigInt(0)) {
    throw new Error('quoteDeposit: `fulfillmentFee` cannot be negative')
  }

  return readContract(client, {
    abi: routerAbi,
    address: routerAddress,
    args: [asset, assets, fulfillmentFee],
    functionName: 'quoteDeposit',
  })
}
