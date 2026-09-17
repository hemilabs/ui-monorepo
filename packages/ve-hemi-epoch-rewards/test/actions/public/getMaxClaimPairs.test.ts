import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { getMaxClaimPairs } from '../../../actions/public/getMaxClaimPairs'
import * as constants from '../../../constants'
import { veHemiEpochRewardsAbi } from '../../../rewardsAbi'

vi.mock('viem/actions')

describe('getMaxClaimPairs', function () {
  const mockRewardsAddress = '0x1234567890123456789012345678901234567890'

  it('should read the bound from the rewards contract', async function () {
    const mockClient = { chain: { id: 9001 } }
    vi.spyOn(constants, 'getVeHemiEpochRewardsContractAddress').mockReturnValue(
      mockRewardsAddress,
    )
    vi.mocked(readContract).mockResolvedValueOnce(BigInt(96))

    const result = await getMaxClaimPairs(mockClient)

    expect(result).toBe(BigInt(96))
    expect(readContract).toHaveBeenCalledWith(mockClient, {
      abi: veHemiEpochRewardsAbi,
      address: mockRewardsAddress,
      functionName: 'MAX_CLAIM_PAIRS',
    })
  })

  it('should throw if the client has no chain', function () {
    expect(() => getMaxClaimPairs({})).toThrow('Client chain is not defined')
  })
})
