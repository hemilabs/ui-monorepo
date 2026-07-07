import {
  type Address,
  type Client,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import { readContract } from 'viem/actions'

import { agentAbi } from '../../agentAbi'

export type UnstakeRequest = {
  amountOutMin: bigint
  asset: Address
  claimableAt: bigint
  nativeFee: bigint
  operator: Address
  share: Address
  shares: bigint
  unstakingRequestId: bigint
}

export const getUnstakeRequest = async function ({
  agentAddress,
  client,
  requestId,
}: {
  agentAddress: Address
  client: Client
  requestId: bigint
}): Promise<UnstakeRequest> {
  if (!isAddress(agentAddress, { strict: false })) {
    throw new Error('getUnstakeRequest: `agentAddress` is not a valid address')
  }
  if (isAddressEqual(agentAddress, zeroAddress)) {
    throw new Error(
      'getUnstakeRequest: `agentAddress` cannot be the zero address',
    )
  }
  if (requestId <= BigInt(0)) {
    throw new Error('getUnstakeRequest: `requestId` must be greater than zero')
  }

  return readContract(client, {
    abi: agentAbi,
    address: agentAddress,
    args: [requestId],
    functionName: 'unstakeRequests',
  })
}
