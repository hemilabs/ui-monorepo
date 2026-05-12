import { type Client, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { quoteDeposit } from '../../../src/actions/public/quoteDeposit'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

const client = {} as Client

describe('quoteDeposit', function () {
  it('forwards args and returns the native fee', async function () {
    vi.mocked(readContract).mockResolvedValue(BigInt(42))

    const result = await quoteDeposit({
      asset: zeroAddress,
      assets: BigInt(100),
      client,
      fulfillmentFee: BigInt(7),
      routerAddress: zeroAddress,
    })

    expect(result).toBe(BigInt(42))
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: zeroAddress,
        args: [zeroAddress, BigInt(100), BigInt(7)],
        functionName: 'quoteDeposit',
      }),
    )
  })
})
