import type { Address, Client } from 'viem'
import { readContract } from 'viem/actions'

import { routerAbi } from '../../abi'
import { getHemiEarnRouterAddress } from '../../constants'

export const quoteDeposit = async ({
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
}): Promise<bigint> =>
  readContract(client, {
    abi: routerAbi,
    address: routerAddress,
    args: [asset, assets, fulfillmentFee],
    functionName: 'quoteDeposit',
  })
