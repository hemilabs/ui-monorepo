import { type Address, type Client, type Hex, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { getFailedRequest } from '../../../src/actions/public/getFailedRequest'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

const client = {} as Client

const agentAddress = '0x000000000000000000000000000000000000dEaD' as Address
const someAddress = '0x000000000000000000000000000000000000bEEF' as Address

const failedRequest = {
  amountIn: BigInt(100),
  msg: '0xabcdef' as Hex,
  nativeFee: BigInt(5),
  tokenIn: someAddress,
}

describe('getFailedRequest', function () {
  it('returns the on-chain failed-request struct', async function () {
    vi.mocked(readContract).mockResolvedValue(failedRequest)

    const result = await getFailedRequest({
      agentAddress,
      client,
      requestId: BigInt(1),
    })

    expect(result).toEqual(failedRequest)
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: agentAddress,
        args: [BigInt(1)],
        functionName: 'failedRequests',
      }),
    )
  })

  it('rejects a non-positive requestId', async function () {
    await expect(
      getFailedRequest({ agentAddress, client, requestId: BigInt(0) }),
    ).rejects.toThrow(/`requestId` must be greater than zero/)
  })

  it('rejects a zero agent address', async function () {
    await expect(
      getFailedRequest({
        agentAddress: zeroAddress,
        client,
        requestId: BigInt(1),
      }),
    ).rejects.toThrow(/`agentAddress` cannot be the zero address/)
  })
})
