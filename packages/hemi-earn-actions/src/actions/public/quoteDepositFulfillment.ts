import { type Address, type Client, isAddressEqual, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'

import { agentAbi } from '../../agentAbi'
import { getHemiEarnAgentAddress } from '../../constants'

// Reads the LayerZero native fee the Agent on Ethereum needs to send the
// fulfillment response back to the Router on Hemi. The caller passes this
// value as `fulfillmentFee` into `quoteDeposit` (Hemi-side), which folds it
// into the total `msg.value` of `requestDeposit`. Without this read the
// Router would underprovision the cross-chain return message and the request
// would stall on the Ethereum side.
export const quoteDepositFulfillment = async function ({
  agentAddress = getHemiEarnAgentAddress(),
  asset,
  client,
}: {
  agentAddress?: Address
  asset: Address
  client: Client
}): Promise<bigint> {
  if (isAddressEqual(asset, zeroAddress)) {
    throw new Error(
      'quoteDepositFulfillment: `asset` cannot be the zero address',
    )
  }

  return readContract(client, {
    abi: agentAbi,
    address: agentAddress,
    args: [asset],
    functionName: 'quoteDepositFulfillment',
  })
}
