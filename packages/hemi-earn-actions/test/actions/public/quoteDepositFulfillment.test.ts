import { type Address, type Client, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { quoteDepositFulfillment } from '../../../src/actions/public/quoteDepositFulfillment'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

const client = {} as Client
const asset = '0x000000000000000000000000000000000000dEaD' as Address
const agentAddress = '0x000000000000000000000000000000000000bEEf' as Address

describe('quoteDepositFulfillment', function () {
  it('forwards args and returns the native fee', async function () {
    vi.mocked(readContract).mockResolvedValue(BigInt(42))

    const result = await quoteDepositFulfillment({
      agentAddress,
      asset,
      client,
    })

    expect(result).toBe(BigInt(42))
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: agentAddress,
        args: [asset],
        functionName: 'quoteDepositFulfillment',
      }),
    )
  })

  it('rejects the zero address as asset', async function () {
    await expect(
      quoteDepositFulfillment({
        agentAddress,
        asset: zeroAddress,
        client,
      }),
    ).rejects.toThrow(/`asset` cannot be the zero address/)
  })
})
