import { zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { veHemiRewardsAbi } from '../../abi'
import { getStartingTimestamp } from '../../actions/public/veHemiRewards'
import { getVeHemiRewardsContractAddress } from '../../constants'

vi.mock('viem/actions')
vi.mock('../../constants')

describe('getStartingTimestamp', function () {
  const mockClient = {
    chain: { id: 1 },
  }

  const mockVeHemiRewardsAddress = zeroAddress
  const mockStartingTimestamp = BigInt(1750000000)

  it('should return starting timestamp', async function () {
    vi.mocked(getVeHemiRewardsContractAddress).mockReturnValue(
      mockVeHemiRewardsAddress,
    )
    vi.mocked(readContract).mockResolvedValue(mockStartingTimestamp)

    const result = await getStartingTimestamp(mockClient)

    expect(result).toBe(mockStartingTimestamp)
    expect(getVeHemiRewardsContractAddress).toHaveBeenCalledWith(1)
    expect(readContract).toHaveBeenCalledWith(mockClient, {
      abi: veHemiRewardsAbi,
      address: mockVeHemiRewardsAddress,
      functionName: 'startingTimestamp',
    })
  })

  it('should throw error when client chain is not defined', async function () {
    const clientWithoutChain = {}

    await expect(getStartingTimestamp(clientWithoutChain)).rejects.toThrow(
      'Client chain is not defined',
    )
  })
})
