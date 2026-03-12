import { zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { veHemiAbi } from '../../../abi'
import { getTotalVotingPower } from '../../../actions/public/veHemi'
import * as constants from '../../../constants'
import { veHemiVoteDelegationAbi } from '../../../voteDelegationAbi'

vi.mock('viem/actions')

describe('getTotalVotingPower', function () {
  const mockVeHemiAddress = zeroAddress
  const mockVoteDelegationAddress = '0x1234567890123456789012345678901234567890'
  const mockAccountAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

  it('should return total voting power and call readContract with correct params', async function () {
    const uniqueChainId = 9001
    const mockClient = { chain: { id: uniqueChainId } }
    const mockVotes = BigInt(1000000)

    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(
      mockVeHemiAddress,
    )
    vi.mocked(readContract)
      .mockResolvedValueOnce(mockVoteDelegationAddress)
      .mockResolvedValueOnce(mockVotes)

    const result = await getTotalVotingPower({
      client: mockClient,
      ownerAddress: mockAccountAddress,
    })

    expect(result).toBe(mockVotes)
    expect(constants.getVeHemiContractAddress).toHaveBeenCalledWith(
      uniqueChainId,
    )
    expect(readContract).toHaveBeenNthCalledWith(1, mockClient, {
      abi: veHemiAbi,
      address: mockVeHemiAddress,
      functionName: 'voteDelegation',
    })
    expect(readContract).toHaveBeenNthCalledWith(2, mockClient, {
      abi: veHemiVoteDelegationAbi,
      address: mockVoteDelegationAddress,
      args: [mockAccountAddress],
      functionName: 'getVotes',
    })
  })

  it('should throw error when client chain is not defined', async function () {
    const clientWithoutChain = { chain: undefined }

    await expect(
      getTotalVotingPower({
        client: clientWithoutChain,
        ownerAddress: mockAccountAddress,
      }),
    ).rejects.toThrow('Client chain is not defined')
  })

  it('should throw error when owner address is invalid', async function () {
    const mockClient = { chain: { id: 2001 } }
    const invalidAddress = 'not-an-address'

    await expect(
      getTotalVotingPower({
        client: mockClient,
        ownerAddress: invalidAddress as `0x${string}`,
      }),
    ).rejects.toThrow('Invalid owner address')
  })
})
