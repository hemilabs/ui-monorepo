import { type Address, type Client, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { quoteRedeem } from '../../../src/actions/public/quoteRedeem'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

const client = {} as Client
const asset = '0x000000000000000000000000000000000000dEaD' as Address
const routerAddress = '0x000000000000000000000000000000000000bEEf' as Address

describe('quoteRedeem', function () {
  it('forwards args and returns the native fee', async function () {
    vi.mocked(readContract).mockResolvedValue(BigInt(42))

    const result = await quoteRedeem({
      asset,
      client,
      fulfillmentFee: BigInt(7),
      routerAddress,
      shares: BigInt(100),
    })

    expect(result).toBe(BigInt(42))
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: routerAddress,
        args: [asset, BigInt(100), BigInt(7)],
        functionName: 'quoteRedeem',
      }),
    )
  })

  it('rejects the zero address as asset', async function () {
    await expect(
      quoteRedeem({
        asset: zeroAddress,
        client,
        fulfillmentFee: BigInt(7),
        routerAddress,
        shares: BigInt(100),
      }),
    ).rejects.toThrow(/`asset` cannot be the zero address/)
  })

  it('rejects non-positive shares', async function () {
    await expect(
      quoteRedeem({
        asset,
        client,
        fulfillmentFee: BigInt(7),
        routerAddress,
        shares: BigInt(0),
      }),
    ).rejects.toThrow(/`shares` must be greater than zero/)
  })

  it('rejects negative fulfillmentFee', async function () {
    await expect(
      quoteRedeem({
        asset,
        client,
        fulfillmentFee: BigInt(-1),
        routerAddress,
        shares: BigInt(100),
      }),
    ).rejects.toThrow(/`fulfillmentFee` cannot be negative/)
  })
})
