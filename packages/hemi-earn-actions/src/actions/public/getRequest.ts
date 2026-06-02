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
  // Address authorized to call `Router.cancel(id)` for cooldown redeems.
  // Set at request time; the UI gates the Cancel CTA on `operator === account`.
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
  // Router IDs start at 1 (see `Router.initialize`), so `0n` is never a valid
  // request and would otherwise return a zero-initialized struct silently.
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
