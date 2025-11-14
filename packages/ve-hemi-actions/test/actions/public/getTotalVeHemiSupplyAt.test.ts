import { zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { veHemiAbi } from '../../../abi'
import { getTotalVeHemiSupplyAt } from '../../../actions'
import * as constants from '../../../constants'

vi.mock('viem/actions')

describe('getTotalVeHemiSupplyAt', function () {
  const mockClient = {
    chain: { id: 1 },
  }

  const mockVeHemiAddress = zeroAddress
  const mockTimestamp = 1761782400n
  const mockTotalSupply = 11649344692938931129822560n

  it('should return total veHEMI supply at specific timestamp', async function () {
    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(
      mockVeHemiAddress,
    )
    vi.mocked(readContract).mockResolvedValue(mockTotalSupply)

    const result = await getTotalVeHemiSupplyAt(mockClient, mockTimestamp)

    expect(result).toBe(mockTotalSupply)
    expect(constants.getVeHemiContractAddress).toHaveBeenCalledWith(1)
    expect(readContract).toHaveBeenCalledWith(mockClient, {
      abi: veHemiAbi,
      address: mockVeHemiAddress,
      args: [mockTimestamp],
      functionName: 'totalVeHemiSupplyAt',
    })
  })

  it('should throw error when client chain is not defined', async function () {
    const clientWithoutChain = {}

    await expect(
      getTotalVeHemiSupplyAt(clientWithoutChain, mockTimestamp),
    ).rejects.toThrow('Client chain is not defined')
  })
})
