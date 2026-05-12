import { type Client, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { quoteRedeem } from '../../../src/actions/public/quoteRedeem'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

const client = {} as Client

describe('quoteRedeem', function () {
  it('forwards args and returns the native fee', async function () {
    vi.mocked(readContract).mockResolvedValue(BigInt(42))

    const result = await quoteRedeem({
      asset: zeroAddress,
      client,
      fulfillmentFee: BigInt(7),
      routerAddress: zeroAddress,
      shares: BigInt(100),
    })

    expect(result).toBe(BigInt(42))
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: zeroAddress,
        args: [zeroAddress, BigInt(100), BigInt(7)],
        functionName: 'quoteRedeem',
      }),
    )
  })
})
