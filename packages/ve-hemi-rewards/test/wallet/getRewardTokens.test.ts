import type { Address } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { getRewardTokens } from '../../actions/public/veHemiRewards'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

vi.mock('../../constants', () => ({
  getVeHemiRewardsContractAddress: vi.fn(() => '0x123'),
}))

describe('getRewardTokens', function () {
  const mockClient = {
    chain: { id: 1 },
  }

  it('should return empty array when numRewardTokens is 0', async function () {
    vi.mocked(readContract).mockResolvedValueOnce(BigInt(0))

    const result = await getRewardTokens(mockClient)

    expect(result).toEqual([])
  })

  it('should return array of token addresses', async function () {
    const mockAddresses: Address[] = [
      '0xToken1',
      '0xToken2',
      '0xToken3',
    ] as Address[]

    vi.mocked(readContract)
      .mockResolvedValueOnce(BigInt(3)) // numRewardTokens
      .mockResolvedValueOnce(mockAddresses[0])
      .mockResolvedValueOnce(mockAddresses[1])
      .mockResolvedValueOnce(mockAddresses[2])

    const result = await getRewardTokens(mockClient)

    expect(result).toEqual(mockAddresses)
    expect(readContract).toHaveBeenCalledTimes(4)
  })

  it('should throw error when client chain is not defined', async function () {
    const invalidClient = {}

    await expect(getRewardTokens(invalidClient)).rejects.toThrow(
      'Client chain is not defined',
    )
  })
})
