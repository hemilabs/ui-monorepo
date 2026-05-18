import { type Address, type Client, isAddressEqual, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'

import { routerAbi } from '../../abi'
import { getHemiEarnRouterAddress } from '../../constants'

export const quoteRedeem = async function ({
  asset,
  client,
  fulfillmentFee,
  routerAddress = getHemiEarnRouterAddress(),
  shares,
}: {
  asset: Address
  client: Client
  fulfillmentFee: bigint
  routerAddress?: Address
  shares: bigint
}): Promise<bigint> {
  if (isAddressEqual(asset, zeroAddress)) {
    throw new Error('quoteRedeem: `asset` cannot be the zero address')
  }
  if (shares <= BigInt(0)) {
    throw new Error('quoteRedeem: `shares` must be greater than zero')
  }
  if (fulfillmentFee < BigInt(0)) {
    throw new Error('quoteRedeem: `fulfillmentFee` cannot be negative')
  }

  return readContract(client, {
    abi: routerAbi,
    address: routerAddress,
    args: [asset, shares, fulfillmentFee],
    functionName: 'quoteRedeem',
  })
}
