import type { Address, PublicClient } from 'viem'
import { readContract } from 'viem/actions'
import { hemi } from 'viem/chains'
import { describe, expect, it, vi } from 'vitest'

import { getRewardPeriod } from '../../actions/public/getRewardPeriod'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

vi.mock('../../constants', () => ({
  getVeHemiRewardsContractAddress: vi.fn(() => '0x123'),
}))

describe('getRewardPeriod', function () {
  const mockClient = {
    chain: hemi,
  } as PublicClient

  const tokenAddress: Address = '0x1234567890123456789012345678901234567890'
  const timestamp = 1_700_000_000

  it('returns the reward period read from the contract', async function () {
    vi.mocked(readContract).mockResolvedValueOnce(BigInt(42))

    const result = await getRewardPeriod(mockClient, {
      timestamp,
      tokenAddress,
    })

    expect(result).toBe(BigInt(42))
    expect(readContract).toHaveBeenCalledTimes(1)
  })

  it('throws when client is not defined', async function () {
    await expect(
      // @ts-expect-error testing invalid input
      getRewardPeriod(undefined, { timestamp, tokenAddress }),
    ).rejects.toThrow('Client is not defined')
  })

  it('throws when client chain is not defined', async function () {
    const invalidClient = {}

    await expect(
      // @ts-expect-error testing invalid input
      getRewardPeriod(invalidClient, { timestamp, tokenAddress }),
    ).rejects.toThrow('Client chain is not defined')
  })

  it('throws on non-integer timestamp', async function () {
    await expect(
      getRewardPeriod(mockClient, { timestamp: 1.5, tokenAddress }),
    ).rejects.toThrow('Invalid timestamp')
  })

  it('throws on NaN timestamp', async function () {
    await expect(
      getRewardPeriod(mockClient, { timestamp: Number.NaN, tokenAddress }),
    ).rejects.toThrow('Invalid timestamp')
  })

  it('throws on Infinity timestamp', async function () {
    await expect(
      getRewardPeriod(mockClient, {
        timestamp: Number.POSITIVE_INFINITY,
        tokenAddress,
      }),
    ).rejects.toThrow('Invalid timestamp')
  })

  it('throws on negative timestamp', async function () {
    await expect(
      getRewardPeriod(mockClient, { timestamp: -1, tokenAddress }),
    ).rejects.toThrow('Invalid timestamp')
  })

  it('throws on malformed token address', async function () {
    await expect(
      getRewardPeriod(mockClient, {
        timestamp,
        tokenAddress: '0xnot-an-address',
      }),
    ).rejects.toThrow('Invalid token address')
  })
})
