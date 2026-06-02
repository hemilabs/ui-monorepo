import { type Address, type Client, isAddressEqual, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'

import { getHemiEarnRouterAddress } from '../../constants'
import { routerAbi } from '../../routerAbi'

export const quoteRedeem = async function ({
  asset,
  client,
  fulfillmentFee,
  isInstant,
  routerAddress = getHemiEarnRouterAddress(),
  shares,
}: {
  asset: Address
  client: Client
  fulfillmentFee: bigint
  // Declares the redeem path the Router should reserve remote gas for. Must
  // match what `Agent.handleRedeemRequest` will compute on Ethereum — see
  // `resolveIsInstant`. If this disagrees with the vault's actual state for
  // the caller, the Agent sends an immediate cancel back instead of executing.
  isInstant: boolean
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
    args: [asset, shares, fulfillmentFee, isInstant],
    functionName: 'quoteRedeem',
  })
}
