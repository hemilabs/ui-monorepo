import { type Client, zeroAddress } from 'viem'
import { multicall } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { getEpochFunding } from '../../../actions/public/getEpochFunding'
import * as constants from '../../../constants'
import { veHemiEpochRewardsLensAbi } from '../../../lensAbi'

vi.mock('viem/actions')

describe('getEpochFunding', function () {
  const mockLensAddress = '0x1234567890123456789012345678901234567890'
  const tokenA = '0x0000000000000000000000000000000000000001'
  const tokenB = '0x0000000000000000000000000000000000000002'
  const uniqueChainId = 9001
  const mockClient = { chain: { id: uniqueChainId } } as Client

  it('should read the funding of every token in one multicall', async function () {
    vi.spyOn(
      constants,
      'getVeHemiEpochRewardsLensContractAddress',
    ).mockReturnValue(mockLensAddress)
    vi.mocked(multicall).mockResolvedValueOnce([
      [
        [10, 11],
        [BigInt(100), BigInt(0)],
        [BigInt(40), BigInt(0)],
        [false, false],
      ],
      [
        [10, 11],
        [BigInt(5), BigInt(6)],
        [BigInt(5), BigInt(0)],
        [true, false],
      ],
    ])

    const result = await getEpochFunding(mockClient, {
      fromEpoch: 10,
      toEpoch: 11,
      tokens: [tokenA, tokenB],
    })

    expect(result).toEqual([
      {
        claimed: [BigInt(40), BigInt(0)],
        epochs: [10, 11],
        funded: [BigInt(100), BigInt(0)],
        swept: [false, false],
        token: tokenA,
      },
      {
        claimed: [BigInt(5), BigInt(0)],
        epochs: [10, 11],
        funded: [BigInt(5), BigInt(6)],
        swept: [true, false],
        token: tokenB,
      },
    ])
    expect(multicall).toHaveBeenCalledWith(mockClient, {
      allowFailure: false,
      contracts: [tokenA, tokenB].map(token => ({
        abi: veHemiEpochRewardsLensAbi,
        address: mockLensAddress,
        args: [token, 10, 11],
        functionName: 'epochFunding',
      })),
    })
  })

  it('should throw error when client chain is not defined', async function () {
    await expect(
      getEpochFunding(
        // @ts-expect-error testing invalid input
        { chain: undefined },
        { fromEpoch: 10, toEpoch: 11, tokens: [tokenA] },
      ),
    ).rejects.toThrow('Client chain is not defined')

    expect(multicall).not.toHaveBeenCalled()
  })

  it('should throw error when a token address is invalid', async function () {
    await expect(
      getEpochFunding(mockClient, {
        fromEpoch: 10,
        toEpoch: 11,
        // @ts-expect-error testing invalid input
        tokens: [tokenA, 'not-an-address'],
      }),
    ).rejects.toThrow('Invalid token address')

    await expect(
      getEpochFunding(mockClient, {
        fromEpoch: 10,
        toEpoch: 11,
        tokens: [zeroAddress],
      }),
    ).rejects.toThrow('Invalid token address')

    expect(multicall).not.toHaveBeenCalled()
  })

  it('should throw error naming the epoch that is not a valid integer', async function () {
    await expect(
      getEpochFunding(mockClient, {
        fromEpoch: -1,
        toEpoch: 11,
        tokens: [tokenA],
      }),
    ).rejects.toThrow('Invalid fromEpoch')

    await expect(
      getEpochFunding(mockClient, {
        fromEpoch: 10,
        toEpoch: 1.5,
        tokens: [tokenA],
      }),
    ).rejects.toThrow('Invalid toEpoch')

    expect(multicall).not.toHaveBeenCalled()
  })

  it('should throw error when the epoch range is inverted', async function () {
    await expect(
      getEpochFunding(mockClient, {
        fromEpoch: 12,
        toEpoch: 11,
        tokens: [tokenA],
      }),
    ).rejects.toThrow('Invalid epoch range')

    expect(multicall).not.toHaveBeenCalled()
  })
})
