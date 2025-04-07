import { zeroAddress } from 'viem'
import { PublicClient } from 'viem'
import { readContract } from 'viem/actions'
import { describe, it, expect, vi } from 'vitest'

import { getErc20TokenAllowance } from '../../src/public/allowance'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

const validParameters = {
  address: zeroAddress,
  owner: zeroAddress,
  spender: zeroAddress,
}

describe('getErc20TokenAllowance', function () {
  it('should throw an error if the address is not valid', async function () {
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: PublicClient = {}
    const parameters = { ...validParameters, address: 'invalid_address' }

    await expect(getErc20TokenAllowance(client, parameters)).rejects.toThrow(
      'Invalid address',
    )
  })

  it('should throw an error if the owner address is not valid', async function () {
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: PublicClient = {}
    const parameters = { ...validParameters, owner: 'invalid_owner' }

    await expect(getErc20TokenAllowance(client, parameters)).rejects.toThrow(
      'Invalid owner address',
    )
  })

  it('should throw an error if the spender address is not valid', async function () {
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: PublicClient = {}
    const parameters = { ...validParameters, spender: 'invalid_spender' }

    await expect(getErc20TokenAllowance(client, parameters)).rejects.toThrow(
      'Invalid spender address',
    )
  })

  it('should call readContract if all addresses are valid', async function () {
    const allowance = BigInt(0)
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: PublicClient = {}
    const parameters = { ...validParameters }

    vi.mocked(readContract).mockResolvedValueOnce(allowance)

    const result = await getErc20TokenAllowance(client, parameters)

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: zeroAddress,
      args: [zeroAddress, zeroAddress],
      functionName: 'allowance',
    })
    expect(result).toBe(allowance)
  })

  it('should handle empty parameters gracefully', async function () {
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: PublicClient = {}
    const parameters = {}

    await expect(getErc20TokenAllowance(client, parameters)).rejects.toThrow(
      'Invalid address',
    )
  })

  it('should handle no parameters gracefully', async function () {
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: PublicClient = {}

    await expect(getErc20TokenAllowance(client, undefined)).rejects.toThrow(
      'Invalid address',
    )
  })
})
