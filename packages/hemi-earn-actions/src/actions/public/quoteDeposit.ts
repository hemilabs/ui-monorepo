import { type Address, type Client, isAddressEqual, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'

import { getHemiEarnRouterAddress } from '../../constants'
import { routerAbi } from '../../routerAbi'

export const quoteDeposit = async function ({
  asset,
  assets,
  callbackFee,
  client,
  routerAddress = getHemiEarnRouterAddress(),
}: {
  asset: Address
  assets: bigint
  client: Client
  callbackFee: bigint
  routerAddress?: Address
}): Promise<bigint> {
  if (isAddressEqual(asset, zeroAddress)) {
    throw new Error('quoteDeposit: `asset` cannot be the zero address')
  }
  if (assets <= BigInt(0)) {
    throw new Error('quoteDeposit: `assets` must be greater than zero')
  }
  if (callbackFee < BigInt(0)) {
    throw new Error('quoteDeposit: `callbackFee` cannot be negative')
  }

  return readContract(client, {
    abi: routerAbi,
    address: routerAddress,
    args: [asset, assets, callbackFee],
    functionName: 'quoteDeposit',
  })
}
