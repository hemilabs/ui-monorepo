import { type Address, type Client, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { previewGatewayRedeem } from '../../../src/actions/public/previewGatewayRedeem'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

const client = {} as Client
const gatewayAddress = '0x000000000000000000000000000000000000bEEf' as Address
const tokenOut = '0x000000000000000000000000000000000000dEaD' as Address

describe('previewGatewayRedeem', function () {
  it('forwards args and returns the asset amount', async function () {
    vi.mocked(readContract).mockResolvedValue(BigInt(75))

    const result = await previewGatewayRedeem({
      client,
      gatewayAddress,
      peggedTokenIn: BigInt(80),
      tokenOut,
    })

    expect(result).toBe(BigInt(75))
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: gatewayAddress,
        args: [tokenOut, BigInt(80)],
        functionName: 'previewRedeem',
      }),
    )
  })

  it('rejects zero gateway address', async function () {
    await expect(
      previewGatewayRedeem({
        client,
        gatewayAddress: zeroAddress,
        peggedTokenIn: BigInt(80),
        tokenOut,
      }),
    ).rejects.toThrow(/`gatewayAddress` cannot be the zero address/)
  })

  it('rejects zero tokenOut', async function () {
    await expect(
      previewGatewayRedeem({
        client,
        gatewayAddress,
        peggedTokenIn: BigInt(80),
        tokenOut: zeroAddress,
      }),
    ).rejects.toThrow(/`tokenOut` cannot be the zero address/)
  })

  it('rejects non-positive peggedTokenIn', async function () {
    await expect(
      previewGatewayRedeem({
        client,
        gatewayAddress,
        peggedTokenIn: BigInt(0),
        tokenOut,
      }),
    ).rejects.toThrow(/`peggedTokenIn` must be greater than zero/)
  })
})
