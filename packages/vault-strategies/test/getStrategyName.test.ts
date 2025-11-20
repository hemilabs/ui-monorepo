import { zeroAddress, type Address, type Client } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { vaultStrategyAbi } from '../src/abi'
import { getStrategyName } from '../src/actions/public/getStrategyName'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

describe('getStrategyName', function () {
  const mockClient = {} as Client
  const validAddress = zeroAddress

  it('should throw error when client is not provided', function () {
    expect(() => getStrategyName(null, { address: zeroAddress })).toThrow(
      'Client is required',
    )

    expect(function () {
      getStrategyName(undefined, { address: zeroAddress })
    }).toThrow('Client is required')
  })

  it('should throw error when address is invalid', function () {
    expect(() =>
      getStrategyName(mockClient, { address: 'invalid-address' as Address }),
    ).toThrow('Invalid address provided')

    expect(() =>
      getStrategyName(mockClient, { address: '' as Address }),
    ).toThrow('Invalid address provided')

    expect(() => getStrategyName(mockClient, { address: null })).toThrow(
      'Invalid address provided',
    )
  })

  it('should call readContract with correct parameters', async function () {
    getStrategyName(mockClient, { address: validAddress })

    expect(vi.mocked(readContract)).toHaveBeenCalledWith(mockClient, {
      abi: vaultStrategyAbi,
      address: validAddress,
      functionName: 'NAME',
    })
  })
})
