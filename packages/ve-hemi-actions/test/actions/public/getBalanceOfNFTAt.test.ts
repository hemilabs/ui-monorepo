import { zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { veHemiAbi } from '../../../abi'
import { getBalanceOfNFTAt } from '../../../actions'
import * as constants from '../../../constants'

vi.mock('viem/actions')

describe('getBalanceOfNFTAt', function () {
  const mockClient = {
    chain: { id: 1 },
  }

  const mockVeHemiAddress = zeroAddress
  const mockTokenId = 514n
  const mockTimestamp = 1761782400n
  const mockBalance = 9245189085900942600n

  beforeEach(function () {
    vi.clearAllMocks()
  })

  it('should return balance of NFT at specific timestamp', async function () {
    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(
      mockVeHemiAddress,
    )
    vi.mocked(readContract).mockResolvedValue(mockBalance)

    const result = await getBalanceOfNFTAt(
      mockClient,
      mockTokenId,
      mockTimestamp,
    )

    expect(result).toBe(mockBalance)
    expect(constants.getVeHemiContractAddress).toHaveBeenCalledWith(1)
    expect(readContract).toHaveBeenCalledWith(mockClient, {
      abi: veHemiAbi,
      address: mockVeHemiAddress,
      args: [mockTokenId, mockTimestamp],
      functionName: 'balanceOfNFTAt',
    })
  })

  it('should throw error when client chain is not defined', async function () {
    const clientWithoutChain = {}

    await expect(
      getBalanceOfNFTAt(clientWithoutChain, mockTokenId, mockTimestamp),
    ).rejects.toThrow('Client chain is not defined')
  })
})
