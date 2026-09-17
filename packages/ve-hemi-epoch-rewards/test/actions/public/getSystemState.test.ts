import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { getSystemState } from '../../../actions/public/getSystemState'
import * as constants from '../../../constants'
import { veHemiEpochRewardsLensAbi } from '../../../lensAbi'

vi.mock('viem/actions')

describe('getSystemState', function () {
  const mockLensAddress = '0x1234567890123456789012345678901234567890'

  it('should return the system state and call readContract with correct params', async function () {
    const uniqueChainId = 9001
    const mockClient = { chain: { id: uniqueChainId } }
    const mockState = {
      currentEpoch: 120,
      epochLength: BigInt(525_960),
      epochStartTime: BigInt(0),
      firstFundableEpoch: 100,
      maxClaimEpochs: BigInt(64),
      maxTokensPerClaim: BigInt(8),
      paused: false,
      pausedUntil: BigInt(0),
      settledEpoch: 119,
      streamCount: BigInt(2),
      tokens: [],
    }

    vi.spyOn(
      constants,
      'getVeHemiEpochRewardsLensContractAddress',
    ).mockReturnValue(mockLensAddress)
    vi.mocked(readContract).mockResolvedValueOnce(mockState)

    const result = await getSystemState(mockClient)

    expect(result).toBe(mockState)
    expect(
      constants.getVeHemiEpochRewardsLensContractAddress,
    ).toHaveBeenCalledWith(uniqueChainId)
    expect(readContract).toHaveBeenCalledWith(mockClient, {
      abi: veHemiEpochRewardsLensAbi,
      address: mockLensAddress,
      functionName: 'systemState',
    })
  })

  it('should throw error when client chain is not defined', async function () {
    await expect(getSystemState({ chain: undefined })).rejects.toThrow(
      'Client chain is not defined',
    )

    expect(readContract).not.toHaveBeenCalled()
  })
})
