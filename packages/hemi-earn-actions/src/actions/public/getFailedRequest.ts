import {
  type Address,
  type Client,
  type Hex,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import { readContract } from 'viem/actions'

import { agentAbi } from '../../agentAbi.ts'

export type FailedRequest = {
  amountIn: bigint
  msg: Hex
  nativeFee: bigint
  tokenIn: Address
}

export const getFailedRequest = async function ({
  agentAddress,
  client,
  requestId,
}: {
  agentAddress: Address
  client: Client
  requestId: bigint
}): Promise<FailedRequest> {
  if (!isAddress(agentAddress, { strict: false })) {
    throw new Error('getFailedRequest: `agentAddress` is not a valid address')
  }
  if (isAddressEqual(agentAddress, zeroAddress)) {
    throw new Error(
      'getFailedRequest: `agentAddress` cannot be the zero address',
    )
  }
  if (requestId <= BigInt(0)) {
    throw new Error('getFailedRequest: `requestId` must be greater than zero')
  }

  return readContract(client, {
    abi: agentAbi,
    address: agentAddress,
    args: [requestId],
    functionName: 'failedRequests',
  })
}
