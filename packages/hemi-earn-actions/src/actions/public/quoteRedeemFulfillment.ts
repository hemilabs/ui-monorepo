import { type Address, type Client, isAddressEqual, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'

import { agentAbi } from '../../agentAbi'
import { getHemiEarnAgentAddress } from '../../constants'

// Reads the LayerZero native fee the Agent on Ethereum needs to send the
// fulfillment response back to the Router on Hemi for a redeem. Caller passes
// this into `quoteRedeem` (Hemi-side) and ultimately as `msg.value` to
// `requestRedeem`. The Agent looks up the share OFT internally from the asset
// address — the portal only needs to supply the asset.
export const quoteRedeemFulfillment = async function ({
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
