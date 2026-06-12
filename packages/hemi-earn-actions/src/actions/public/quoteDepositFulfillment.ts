import {
  type Address,
  type Client,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import { readContract } from 'viem/actions'

import { agentAbi } from '../../agentAbi'

// Reads the LayerZero native fee the Agent on Ethereum needs to send the
// fulfillment response (sVetToken OFT) back to the Router on Hemi. The
// caller passes this value as `callbackFee` into `quoteDeposit`
// (Hemi-side), which folds it into the total `msg.value` of `requestDeposit`.
//
// `share` is the **Ethereum-side staking vault (sVetToken) address** — the
// token being OFT-bridged back on the fulfillment leg. Since the
// `b071540 Stateless Agent` refactor the Agent no longer holds an
// `assetsData(asset)` mapping; the share has to be supplied directly.
// Resolve via `getStakingVaultForShare(shareOft)` on the portal.
export const quoteDepositFulfillment = async function ({
  agentAddress,
  client,
  share,
}: {
  agentAddress: Address
  client: Client
  share: Address
}): Promise<bigint> {
  if (!isAddress(agentAddress, { strict: false })) {
    throw new Error(
      'quoteDepositFulfillment: `agentAddress` is not a valid address',
    )
  }
  if (isAddressEqual(agentAddress, zeroAddress)) {
    throw new Error(
      'quoteDepositFulfillment: `agentAddress` cannot be the zero address',
    )
  }
  if (isAddressEqual(share, zeroAddress)) {
    throw new Error(
      'quoteDepositFulfillment: `share` cannot be the zero address',
    )
  }

  return readContract(client, {
    abi: agentAbi,
    address: agentAddress,
    args: [share],
    functionName: 'quoteDepositFulfillment',
  })
}
