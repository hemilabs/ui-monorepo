import {
  type Address,
  type Client,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import { readContract } from 'viem/actions'

import { agentAbi } from '../../agentAbi'

// Native fee the Agent needs to send its redeem fulfillment back to Hemi; the caller
// folds it into requestRedeem's msg.value via quoteRedeem.
export const quoteRedeemFulfillment = async function ({
  agentAddress,
  asset,
  client,
}: {
  agentAddress: Address
  asset: Address
  client: Client
}): Promise<bigint> {
  if (!isAddress(agentAddress, { strict: false })) {
    throw new Error(
      'quoteRedeemFulfillment: `agentAddress` is not a valid address',
    )
  }
  if (isAddressEqual(agentAddress, zeroAddress)) {
    throw new Error(
      'quoteRedeemFulfillment: `agentAddress` cannot be the zero address',
    )
  }
  if (isAddressEqual(asset, zeroAddress)) {
    throw new Error(
      'quoteRedeemFulfillment: `asset` cannot be the zero address',
    )
  }

  return readContract(client, {
    abi: agentAbi,
    address: agentAddress,
    args: [asset],
    functionName: 'quoteRedeemFulfillment',
  })
}
