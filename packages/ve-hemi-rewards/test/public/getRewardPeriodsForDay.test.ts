import { zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { veHemiRewardsAbi } from '../../abi'
import { getRewardPeriodsForDay } from '../../actions/public/veHemiRewards'
import { getVeHemiRewardsContractAddress } from '../../constants'

vi.mock('viem/actions')
vi.mock('../../constants')

describe('getRewardPeriodsForDay', function () {
  const mockClient = {
    chain: { id: 1 },
  }

  const mockVeHemiRewardsAddress = zeroAddress
  const mockRewardToken = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  const mockTimestamp = BigInt(1750000000)
  const mockRewardsPerDay = BigInt(8333000000000000000000)

  it('should return rewards per day for given token and timestamp', async function () {
    vi.mocked(getVeHemiRewardsContractAddress).mockReturnValue(
      mockVeHemiRewardsAddress,
    )
    vi.mocked(readContract).mockResolvedValue(mockRewardsPerDay)

    const result = await getRewardPeriodsForDay(
      mockClient,
      mockRewardToken,
      mockTimestamp,
    )

    expect(result).toBe(mockRewardsPerDay)
    expect(getVeHemiRewardsContractAddress).toHaveBeenCalledWith(1)
    expect(readContract).toHaveBeenCalledWith(mockClient, {
      abi: veHemiRewardsAbi,
      address: mockVeHemiRewardsAddress,
      args: [mockRewardToken, mockTimestamp],
      functionName: 'rewardPeriods',
    })
  })

  it('should throw error when client chain is not defined', async function () {
    const clientWithoutChain = {}

    await expect(
      getRewardPeriodsForDay(
        clientWithoutChain,
        mockRewardToken,
        mockTimestamp,
      ),
    ).rejects.toThrow('Client chain is not defined')
  })
})
