import { type Address, type Client, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { inversePreviewRedeem } from '../../../src/actions/public/inversePreviewRedeem'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

const client = {} as Client
const gatewayAddress = '0x000000000000000000000000000000000000bEEf' as Address
const tokenOut = '0x000000000000000000000000000000000000dEaD' as Address

describe('inversePreviewRedeem', function () {
  it('probes previewRedeem at amount and inverts the linear relationship', async function () {
    // 0.2% redeemFee scenario: previewRedeem(asset, X) = X * 9980 / 10000.
    // Probe at amount=10000 → contract returns 9980. We need the smallest
    // peggedIn whose redeem covers 10000 asset out: peggedIn = ceil(amount²
    // / probe) = ceil(100_000_000 / 9980) = 10021 (10020.04...).
    // At 10020 the redeem would only return 9999 (floor of 10020*9980/10000),
    // so the ceil step is what guarantees the UX promise.
    vi.mocked(readContract).mockResolvedValue(BigInt(9980))

    const result = await inversePreviewRedeem({
      amount: BigInt(10000),
      client,
      gatewayAddress,
      tokenOut,
    })

    expect(result).toBe(BigInt(10021))
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: gatewayAddress,
        args: [tokenOut, BigInt(10000)],
        functionName: 'previewRedeem',
      }),
    )
  })

  it('returns amount unchanged when the gateway has no fee', async function () {
    // Anvil mock with redeemRateBps = 10000 → probe == amount → peggedIn == amount.
    vi.mocked(readContract).mockResolvedValue(BigInt(1_000_000))

    const result = await inversePreviewRedeem({
      amount: BigInt(1_000_000),
      client,
      gatewayAddress,
      tokenOut,
    })

    expect(result).toBe(BigInt(1_000_000))
  })

  it('returns zero when previewRedeem returns zero', async function () {
    // Gateway disabled / asset blocked — caller can gate the UI on `0n`.
    vi.mocked(readContract).mockResolvedValue(BigInt(0))

    const result = await inversePreviewRedeem({
      amount: BigInt(1_000),
      client,
      gatewayAddress,
      tokenOut,
    })

    expect(result).toBe(BigInt(0))
  })

  it('rejects zero gateway address', async function () {
    await expect(
      inversePreviewRedeem({
        amount: BigInt(1),
        client,
        gatewayAddress: zeroAddress,
        tokenOut,
      }),
    ).rejects.toThrow(/`gatewayAddress` cannot be the zero address/)
  })

  it('rejects zero tokenOut', async function () {
    await expect(
      inversePreviewRedeem({
        amount: BigInt(1),
        client,
        gatewayAddress,
        tokenOut: zeroAddress,
      }),
    ).rejects.toThrow(/`tokenOut` cannot be the zero address/)
  })

  it('rejects non-positive amount', async function () {
    await expect(
      inversePreviewRedeem({
        amount: BigInt(0),
        client,
        gatewayAddress,
        tokenOut,
      }),
    ).rejects.toThrow(/`amount` must be greater than zero/)
  })
})
