import { zeroAddress } from 'viem'
import { PublicClient } from 'viem'
import { readContract } from 'viem/actions'
import { describe, it, expect, vi } from 'vitest'

import { getErc20TokenBalance } from '../../src/public/balance'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

const validParameters = {
  account: zeroAddress,
  address: zeroAddress,
}

describe('getErc20TokenBalance', function () {
  it('should throw an error if the account address is not valid', async function () {
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: PublicClient = {}
    const parameters = { ...validParameters, account: 'invalid_account' }

    await expect(getErc20TokenBalance(client, parameters)).rejects.toThrow(
      'Invalid account',
    )
  })

  it('should throw an error if the token address is not valid', async function () {
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: PublicClient = {}
    const parameters = { ...validParameters, address: 'invalid_address' }

    await expect(getErc20TokenBalance(client, parameters)).rejects.toThrow(
      'Invalid owner address',
    )
  })

  it('should call readContract if all addresses are valid', async function () {
    const balance = BigInt(1000)
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: PublicClient = {}
    const parameters = { ...validParameters }

    vi.mocked(readContract).mockResolvedValueOnce(balance)

    const result = await getErc20TokenBalance(client, parameters)

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: zeroAddress,
      args: [zeroAddress],
      functionName: 'balanceOf',
    })
    expect(result).toBe(balance)
  })

  it('should handle empty parameters gracefully', async function () {
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: PublicClient = {}
    const parameters = {}

    await expect(getErc20TokenBalance(client, parameters)).rejects.toThrow(
      'Invalid account',
    )
  })

  it('should handle no parameters gracefully', async function () {
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: PublicClient = {}

    await expect(getErc20TokenBalance(client, undefined)).rejects.toThrow(
      'Invalid account',
    )
  })
})
