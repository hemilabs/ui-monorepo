import { zeroAddress } from 'viem'
import { multicall, readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { veHemiAbi } from '../../../abi'
import { getPositionsVotingPowerSum } from '../../../actions/public/veHemi'
import * as constants from '../../../constants'
import { veHemiVoteDelegationAbi } from '../../../voteDelegationAbi'

vi.mock('viem/actions')

describe('getPositionsVotingPowerSum', function () {
  const mockVeHemiAddress = zeroAddress
  const mockVoteDelegationAddress = '0x1234567890123456789012345678901234567890'
  const mockOwnerAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

  it('should return sum of voting power and call multicall with correct params', async function () {
    const mockClient = { chain: { id: 2001 } }
    const tokenIds = [BigInt(1), BigInt(2)]
    const now = BigInt(Math.floor(Date.now() / 1000))
    const futureEnd = now + BigInt(86400)

    const mockDelegations = [
      {
        amount: BigInt(500000),
        bias: now * BigInt(100) + BigInt(50000),
        delegatee: mockOwnerAddress,
        end: futureEnd,
        slope: BigInt(100),
      },
      {
        amount: BigInt(300000),
        bias: now * BigInt(100) + BigInt(30000),
        delegatee: mockOwnerAddress,
        end: futureEnd,
        slope: BigInt(100),
      },
    ]

    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(
      mockVeHemiAddress,
    )
    vi.mocked(readContract).mockResolvedValue(mockVoteDelegationAddress)
    vi.mocked(multicall).mockResolvedValue(mockDelegations)

    const result = await getPositionsVotingPowerSum({
      client: mockClient,
      ownerAddress: mockOwnerAddress,
      tokenIds,
    })

    expect(result).toBe(BigInt(80000)) // 50000 + 30000
    expect(readContract).toHaveBeenCalledWith(mockClient, {
      abi: veHemiAbi,
      address: mockVeHemiAddress,
      functionName: 'voteDelegation',
    })
    expect(multicall).toHaveBeenCalledWith(mockClient, {
      allowFailure: false,
      contracts: tokenIds.map(tokenId => ({
        abi: veHemiVoteDelegationAbi,
        address: mockVoteDelegationAddress,
        args: [tokenId],
        functionName: 'delegation',
      })),
    })
  })

  it('should return 0 when tokenIds is empty without calling multicall', async function () {
    const mockClient = { chain: { id: 2001 } }

    const result = await getPositionsVotingPowerSum({
      client: mockClient,
      ownerAddress: mockOwnerAddress,
      tokenIds: [],
    })

    expect(result).toBe(BigInt(0))
    expect(multicall).not.toHaveBeenCalled()
    expect(readContract).not.toHaveBeenCalled()
  })

  it('should throw error when client chain is not defined', async function () {
    const clientWithoutChain = { chain: undefined }

    await expect(
      getPositionsVotingPowerSum({
        client: clientWithoutChain,
        ownerAddress: mockOwnerAddress,
        tokenIds: [BigInt(1)],
      }),
    ).rejects.toThrow('Client chain is not defined')
  })

  it('should throw error when owner address is invalid', async function () {
    const mockClient = { chain: { id: 2001 } }
    const invalidAddress = 'not-an-address'

    await expect(
      getPositionsVotingPowerSum({
        client: mockClient,
        ownerAddress: invalidAddress as `0x${string}`,
        tokenIds: [BigInt(1)],
      }),
    ).rejects.toThrow('Invalid owner address')
  })

  it('should throw when multicall fails (allowFailure: false)', async function () {
    const mockClient = { chain: { id: 2001 } }

    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(
      mockVeHemiAddress,
    )
    vi.mocked(readContract).mockResolvedValue(mockVoteDelegationAddress)
    vi.mocked(multicall).mockRejectedValue(new Error('Multicall reverted'))

    await expect(
      getPositionsVotingPowerSum({
        client: mockClient,
        ownerAddress: mockOwnerAddress,
        tokenIds: [BigInt(1)],
      }),
    ).rejects.toThrow('Multicall reverted')
  })
})
