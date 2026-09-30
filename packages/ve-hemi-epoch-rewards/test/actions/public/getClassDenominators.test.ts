import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { getClassDenominators } from '../../../actions/public/getClassDenominators'
import * as constants from '../../../constants'
import { veHemiEpochRewardsAbi } from '../../../rewardsAbi'

vi.mock('viem/actions')

describe('getClassDenominators', function () {
  const mockRewardsAddress = '0x1234567890123456789012345678901234567890'
  const transferable = BigInt('11842292000000000000000000')
  const locked = BigInt('398561993000000000000000000')
  const forfeitable = BigInt('79629166000000000000000000')

  it('should name the class each denominator belongs to', async function () {
    const uniqueChainId = 9001
    const mockClient = { chain: { id: uniqueChainId } }

    vi.spyOn(constants, 'getVeHemiEpochRewardsContractAddress').mockReturnValue(
      mockRewardsAddress,
    )
    vi.mocked(readContract).mockResolvedValueOnce([
      transferable,
      locked,
      forfeitable,
    ])

    const result = await getClassDenominators(mockClient, { epoch: 3404 })

    expect(result).toEqual({ forfeitable, locked, transferable })
    expect(constants.getVeHemiEpochRewardsContractAddress).toHaveBeenCalledWith(
      uniqueChainId,
    )
    expect(readContract).toHaveBeenCalledWith(mockClient, {
      abi: veHemiEpochRewardsAbi,
      address: mockRewardsAddress,
      args: [3404],
      functionName: 'classDenominators',
    })
  })

  it('should throw error when client chain is not defined', async function () {
    await expect(
      getClassDenominators({ chain: undefined }, { epoch: 3404 }),
    ).rejects.toThrow('Client chain is not defined')

    expect(readContract).not.toHaveBeenCalled()
  })

  it('should throw on a negative epoch', async function () {
    const mockClient = { chain: { id: 9001 } }

    await expect(
      getClassDenominators(mockClient, { epoch: -1 }),
    ).rejects.toThrow('Invalid epoch')

    expect(readContract).not.toHaveBeenCalled()
  })

  it('should throw on an epoch that is not a whole number', async function () {
    const mockClient = { chain: { id: 9001 } }

    await expect(
      getClassDenominators(mockClient, { epoch: 3404.5 }),
    ).rejects.toThrow('Invalid epoch')

    expect(readContract).not.toHaveBeenCalled()
  })
})
