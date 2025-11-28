import { zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { veHemiAbi } from '../../../abi'
import { getPositionVotingPower } from '../../../actions/public/veHemi'
import * as constants from '../../../constants'
import { veHemiVoteDelegationAbi } from '../../../voteDelegationAbi'

vi.mock('viem/actions')

describe('getPositionVotingPower', function () {
  const mockVeHemiAddress = zeroAddress
  const mockVoteDelegationAddress = '0x1234567890123456789012345678901234567890'
  const mockOwnerAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  const mockTokenId = BigInt(1)

  it('should return voting power for an active position', async function () {
    const mockClient = { chain: { id: 2001 } }
    const now = BigInt(Math.floor(Date.now() / 1000))
    const futureEnd = now + BigInt(86400) // 1 day from now

    const mockDelegation = {
      amount: BigInt(500000),
      bias: now * BigInt(100) + BigInt(50000),
      delegatee: mockOwnerAddress,
      end: futureEnd,
      slope: BigInt(100),
    }

    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(
      mockVeHemiAddress,
    )
    vi.mocked(readContract)
      .mockResolvedValueOnce(mockVoteDelegationAddress)
      .mockResolvedValueOnce(mockDelegation)

    const result = await getPositionVotingPower({
      client: mockClient,
      ownerAddress: mockOwnerAddress,
      tokenId: mockTokenId,
    })

    expect(result).toBe(BigInt(50000))
    expect(readContract).toHaveBeenNthCalledWith(1, mockClient, {
      abi: veHemiAbi,
      address: mockVeHemiAddress,
      functionName: 'voteDelegation',
    })
    expect(readContract).toHaveBeenNthCalledWith(2, mockClient, {
      abi: veHemiVoteDelegationAbi,
      address: mockVoteDelegationAddress,
      args: [mockTokenId],
      functionName: 'delegation',
    })
  })

  it('should return 0 when position is delegated to another wallet', async function () {
    const mockClient = { chain: { id: 2004 } }
    const now = BigInt(Math.floor(Date.now() / 1000))
    const futureEnd = now + BigInt(86400)

    const anotherWallet = '0x9999999999999999999999999999999999999999'

    const mockDelegation = {
      amount: BigInt(500000),
      bias: now * BigInt(100) + BigInt(50000),
      delegatee: anotherWallet,
      end: futureEnd,
      slope: BigInt(100),
    }

    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(
      mockVeHemiAddress,
    )
    vi.mocked(readContract)
      .mockResolvedValueOnce(mockVoteDelegationAddress)
      .mockResolvedValueOnce(mockDelegation)

    const result = await getPositionVotingPower({
      client: mockClient,
      ownerAddress: mockOwnerAddress,
      tokenId: mockTokenId,
    })

    expect(result).toBe(BigInt(0))
  })

  it('should return 0 for expired position', async function () {
    const mockClient = { chain: { id: 2002 } }
    const now = BigInt(Math.floor(Date.now() / 1000))
    const pastEnd = now - BigInt(86400)

    const mockDelegation = {
      amount: BigInt(500000),
      bias: BigInt(1000000),
      delegatee: mockOwnerAddress,
      end: pastEnd,
      slope: BigInt(100),
    }

    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(
      mockVeHemiAddress,
    )
    vi.mocked(readContract)
      .mockResolvedValueOnce(mockVoteDelegationAddress)
      .mockResolvedValueOnce(mockDelegation)

    const result = await getPositionVotingPower({
      client: mockClient,
      ownerAddress: mockOwnerAddress,
      tokenId: mockTokenId,
    })

    expect(result).toBe(BigInt(0))
  })

  it('should return 0 when vote decay exceeds bias', async function () {
    const mockClient = { chain: { id: 2003 } }
    const now = BigInt(Math.floor(Date.now() / 1000))
    const futureEnd = now + BigInt(86400)

    const mockDelegation = {
      amount: BigInt(500000),
      bias: BigInt(100),
      delegatee: mockOwnerAddress,
      end: futureEnd,
      slope: BigInt(1000000),
    }

    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(
      mockVeHemiAddress,
    )
    vi.mocked(readContract)
      .mockResolvedValueOnce(mockVoteDelegationAddress)
      .mockResolvedValueOnce(mockDelegation)

    const result = await getPositionVotingPower({
      client: mockClient,
      ownerAddress: mockOwnerAddress,
      tokenId: mockTokenId,
    })

    expect(result).toBe(BigInt(0))
  })

  it('should throw error when client chain is not defined', async function () {
    const clientWithoutChain = { chain: undefined }

    await expect(
      getPositionVotingPower({
        client: clientWithoutChain,
        ownerAddress: mockOwnerAddress,
        tokenId: mockTokenId,
      }),
    ).rejects.toThrow('Client chain is not defined')
  })
})
