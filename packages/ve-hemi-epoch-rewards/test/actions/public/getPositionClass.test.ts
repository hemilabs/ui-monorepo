import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { getPositionClass } from '../../../actions/public/getPositionClass'
import * as constants from '../../../constants'
import { veHemiEpochRewardsAbi } from '../../../rewardsAbi'

vi.mock('viem/actions')

describe('getPositionClass', function () {
  const mockRewardsAddress = '0x1234567890123456789012345678901234567890'

  it('should read the class of the position', async function () {
    const mockClient = { chain: { id: 9001 } }
    vi.spyOn(constants, 'getVeHemiEpochRewardsContractAddress').mockReturnValue(
      mockRewardsAddress,
    )
    vi.mocked(readContract).mockResolvedValueOnce([BigInt(10), false, true])

    const result = await getPositionClass(mockClient, { tokenId: BigInt(3) })

    expect(result).toEqual([BigInt(10), false, true])
    expect(readContract).toHaveBeenCalledWith(mockClient, {
      abi: veHemiEpochRewardsAbi,
      address: mockRewardsAddress,
      args: [BigInt(3)],
      functionName: 'positionClass',
    })
  })

  it('should throw if the client has no chain', function () {
    expect(() => getPositionClass({}, { tokenId: BigInt(1) })).toThrow(
      'Client chain is not defined',
    )
  })
})
