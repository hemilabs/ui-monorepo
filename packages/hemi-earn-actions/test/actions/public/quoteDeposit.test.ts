import { type Address, type Client, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { quoteDeposit } from '../../../src/actions/public/quoteDeposit'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

const client = {} as Client
const asset = '0x000000000000000000000000000000000000dEaD' as Address
const routerAddress = '0x000000000000000000000000000000000000bEEf' as Address

describe('quoteDeposit', function () {
  it('forwards args and returns the native fee', async function () {
    vi.mocked(readContract).mockResolvedValue(BigInt(42))

    const result = await quoteDeposit({
      asset,
      assets: BigInt(100),
      callbackFee: BigInt(7),
      client,
      routerAddress,
    })

    expect(result).toBe(BigInt(42))
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: routerAddress,
        args: [asset, BigInt(100), BigInt(7)],
        functionName: 'quoteDeposit',
      }),
    )
  })

  it('rejects the zero address as asset', async function () {
    await expect(
      quoteDeposit({
        asset: zeroAddress,
        assets: BigInt(100),
        callbackFee: BigInt(7),
        client,
        routerAddress,
      }),
    ).rejects.toThrow(/`asset` cannot be the zero address/)
  })

  it('rejects non-positive assets', async function () {
    await expect(
      quoteDeposit({
        asset,
        assets: BigInt(0),
        callbackFee: BigInt(7),
        client,
        routerAddress,
      }),
    ).rejects.toThrow(/`assets` must be greater than zero/)
  })

  it('rejects negative callbackFee', async function () {
    await expect(
      quoteDeposit({
        asset,
        assets: BigInt(100),
        callbackFee: BigInt(-1),
        client,
        routerAddress,
      }),
    ).rejects.toThrow(/`callbackFee` cannot be negative/)
  })
})
