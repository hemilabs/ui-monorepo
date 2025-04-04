import { zeroAddress } from 'viem'
import { WalletClient } from 'viem'
import { writeContract } from 'viem/actions'
import { describe, it, expect, vi } from 'vitest'

import { approveErc20Token } from '../../src/wallet/approve'

vi.mock('viem/actions', () => ({
  writeContract: vi.fn(),
}))

const validParameters = {
  address: zeroAddress,
  amount: BigInt(1000),
  spender: zeroAddress,
}

describe('approveErc20Token', function () {
  it('should throw an error if the token address is not valid', async function () {
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: WalletClient = {}
    const parameters = { ...validParameters, address: 'invalid_address' }

    await expect(approveErc20Token(client, parameters)).rejects.toThrow(
      'Invalid address',
    )
  })

  it('should throw an error if the spender address is not valid', async function () {
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: WalletClient = {}
    const parameters = { ...validParameters, spender: 'invalid_spender' }

    await expect(approveErc20Token(client, parameters)).rejects.toThrow(
      'Invalid spender address',
    )
  })

  it('should throw an error if the amount is not a bigint', async function () {
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: WalletClient = {}
    const parameters = { ...validParameters, amount: 1000 } // Not a bigint

    await expect(approveErc20Token(client, parameters)).rejects.toThrow(
      'Invalid amount',
    )
  })

  it('should throw an error if the amount is less than or equal to 0', async function () {
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: WalletClient = {}
    const parameters = { ...validParameters, amount: BigInt(0) }

    await expect(approveErc20Token(client, parameters)).rejects.toThrow(
      'Invalid amount, must be greater than 0',
    )
  })

  it('should call writeContract if all parameters are valid', async function () {
    // @ts-expect-error - We only create an empty client for testing purposes
    const client: WalletClient = { account: zeroAddress, chain: {} }
    const parameters = { ...validParameters }

    vi.mocked(writeContract).mockResolvedValueOnce({ success: true })

    const result = await approveErc20Token(client, parameters)

    expect(writeContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      account: zeroAddress,
      address: zeroAddress,
      args: [zeroAddress, BigInt(1000)],
      chain: client.chain,
      functionName: 'approve',
    })
    expect(result).toEqual({ success: true })
  })
})
