import type { Address, Client } from 'viem'
import { readContract } from 'viem/actions'

import { getHemiEarnRouterAddress } from '../../constants'
import { routerAbi } from '../../routerAbi'
import type { RequestKind, RequestStatus } from '../../types'

export type Request = {
  amountOutMin: bigint
  asset: Address
  assets: bigint
  automatic: boolean
  kind: RequestKind
  // Authorized to call Router.cancel for cooldown redeems.
  operator: Address
  receiver: Address
  share: Address
  shares: bigint
  status: RequestStatus
}

export const getRequest = async function ({
  client,
  requestId,
  routerAddress = getHemiEarnRouterAddress(),
}: {
  client: Client
  requestId: bigint
  routerAddress?: Address
}): Promise<Request> {
  // Router IDs start at 1; reject 0n so we don't read a zero-initialized struct.
  if (requestId <= BigInt(0)) {
    throw new Error('getRequest: `requestId` must be greater than zero')
  }

  const result = await readContract(client, {
    abi: routerAbi,
    address: routerAddress,
    args: [requestId],
    functionName: 'requests',
  })

  return {
    ...result,
    kind: result.kind as RequestKind,
    status: result.status as RequestStatus,
  }
}
