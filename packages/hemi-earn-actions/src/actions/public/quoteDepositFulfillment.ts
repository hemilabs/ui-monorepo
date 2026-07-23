import {
  type Address,
  type Client,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import { readContract } from 'viem/actions'

import { agentAbi } from '../../agentAbi.ts'

// Native fee the Agent needs to send its fulfillment OFT back to Hemi; the caller
// folds it into requestDeposit's msg.value via quoteDeposit.
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
