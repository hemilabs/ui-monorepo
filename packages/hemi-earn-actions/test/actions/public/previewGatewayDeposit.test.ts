import { type Address, type Client, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { previewGatewayDeposit } from '../../../src/actions/public/previewGatewayDeposit'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

const client = {} as Client
const gatewayAddress = '0x000000000000000000000000000000000000bEEf' as Address
const tokenIn = '0x000000000000000000000000000000000000dEaD' as Address

describe('previewGatewayDeposit', function () {
  it('forwards args and returns the pegged amount', async function () {
    vi.mocked(readContract).mockResolvedValue(BigInt(100))

    const result = await previewGatewayDeposit({
      amountIn: BigInt(50),
      client,
      gatewayAddress,
      tokenIn,
    })

    expect(result).toBe(BigInt(100))
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: gatewayAddress,
        args: [tokenIn, BigInt(50)],
        functionName: 'previewDeposit',
      }),
    )
  })

  it('rejects zero gateway address', async function () {
    await expect(
      previewGatewayDeposit({
        amountIn: BigInt(50),
        client,
        gatewayAddress: zeroAddress,
        tokenIn,
      }),
    ).rejects.toThrow(/`gatewayAddress` cannot be the zero address/)
  })

  it('rejects zero tokenIn', async function () {
    await expect(
      previewGatewayDeposit({
        amountIn: BigInt(50),
        client,
        gatewayAddress,
        tokenIn: zeroAddress,
      }),
    ).rejects.toThrow(/`tokenIn` cannot be the zero address/)
  })

  it('rejects non-positive amountIn', async function () {
    await expect(
      previewGatewayDeposit({
        amountIn: BigInt(0),
        client,
        gatewayAddress,
        tokenIn,
      }),
    ).rejects.toThrow(/`amountIn` must be greater than zero/)
  })
})
