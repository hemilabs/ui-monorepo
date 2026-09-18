import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { getClaimableByToken } from '../../../actions/public/getClaimableByToken'
import * as constants from '../../../constants'
import { veHemiEpochRewardsLensAbi } from '../../../lensAbi'

vi.mock('viem/actions')

describe('getClaimableByToken', function () {
  const mockLensAddress = '0x1234567890123456789012345678901234567890'
  const mockHolder = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  const uniqueChainId = 9001
  const mockClient = { chain: { id: uniqueChainId } }

  const options = {
    fromEpoch: 100,
    holder: mockHolder as `0x${string}`,
    toEpoch: 119,
    tokenId: BigInt(7),
  }

  const mockLensAddressResolution = () =>
    vi
      .spyOn(constants, 'getVeHemiEpochRewardsLensContractAddress')
      .mockReturnValue(mockLensAddress)

  it('should return the claimable rows and call readContract with correct params', async function () {
    const mockRows = [
      {
        carry: BigInt(3),
        claimable: BigInt(1000),
        decimals: 18,
        symbol: 'HEMI',
        token: '0x0000000000000000000000000000000000000001',
      },
    ]

    mockLensAddressResolution()
    vi.mocked(readContract).mockResolvedValueOnce(mockRows)

    const result = await getClaimableByToken(mockClient, options)

    expect(result).toBe(mockRows)
    expect(
      constants.getVeHemiEpochRewardsLensContractAddress,
    ).toHaveBeenCalledWith(uniqueChainId)
    expect(readContract).toHaveBeenCalledWith(mockClient, {
      abi: veHemiEpochRewardsLensAbi,
      address: mockLensAddress,
      args: [BigInt(7), mockHolder, 100, 119],
      functionName: 'claimableByToken',
    })
  })

  it('should throw error when client chain is not defined', async function () {
    await expect(
      getClaimableByToken({ chain: undefined }, options),
    ).rejects.toThrow('Client chain is not defined')
  })

  it('should throw error when the holder address is invalid', async function () {
    await expect(
      getClaimableByToken(mockClient, {
        ...options,
        holder: 'not-an-address' as `0x${string}`,
      }),
    ).rejects.toThrow('Invalid holder address')
  })

  it('should throw error when an epoch is not a valid integer', async function () {
    await expect(
      getClaimableByToken(mockClient, { ...options, fromEpoch: -1 }),
    ).rejects.toThrow('Invalid epoch')

    await expect(
      getClaimableByToken(mockClient, { ...options, toEpoch: 1.5 }),
    ).rejects.toThrow('Invalid epoch')
  })

  it('should throw error when the epoch range is inverted', async function () {
    await expect(
      getClaimableByToken(mockClient, {
        ...options,
        fromEpoch: 120,
        toEpoch: 119,
      }),
    ).rejects.toThrow('Invalid epoch range')

    expect(readContract).not.toHaveBeenCalled()
  })
})
