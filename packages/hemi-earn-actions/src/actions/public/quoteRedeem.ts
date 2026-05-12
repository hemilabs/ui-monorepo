import type { Address, Client } from 'viem'
import { readContract } from 'viem/actions'

import { routerAbi } from '../../abi'
import { getHemiEarnRouterAddress } from '../../constants'

export const quoteRedeem = async ({
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
}): Promise<bigint> =>
  readContract(client, {
    abi: routerAbi,
    address: routerAddress,
    args: [asset, shares, fulfillmentFee],
    functionName: 'quoteRedeem',
  })
