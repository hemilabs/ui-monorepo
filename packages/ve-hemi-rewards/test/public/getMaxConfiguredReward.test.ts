import { zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { veHemiRewardsAbi } from '../../abi'
import { getMaxConfiguredReward } from '../../actions/public/veHemiRewards'
import * as constants from '../../constants'

vi.mock('viem/actions')

describe('getMaxConfiguredReward', function () {
  const mockClient = {
    chain: { id: 1 },
  }

  const mockVeHemiRewardsAddress = zeroAddress
  const mockRewardToken = '0x99e3dE3817F6081B2568208337ef83295b7f591D'
  const mockMaxConfigured = 1761782400n

  it('should return max configured reward timestamp for given token', async function () {
    vi.spyOn(constants, 'getVeHemiRewardsContractAddress').mockReturnValue(
      mockVeHemiRewardsAddress,
    )
    vi.mocked(readContract).mockResolvedValue(mockMaxConfigured)

    const result = await getMaxConfiguredReward(mockClient, mockRewardToken)

    expect(result).toBe(mockMaxConfigured)
    expect(constants.getVeHemiRewardsContractAddress).toHaveBeenCalledWith(1)
    expect(readContract).toHaveBeenCalledWith(mockClient, {
      abi: veHemiRewardsAbi,
      address: mockVeHemiRewardsAddress,
      args: [mockRewardToken],
      functionName: 'maxConfiguredReward',
    })
  })

  it('should throw error when client chain is not defined', async function () {
    const clientWithoutChain = {}

    await expect(
      getMaxConfiguredReward(clientWithoutChain, mockRewardToken),
    ).rejects.toThrow('Client chain is not defined')
  })
})
