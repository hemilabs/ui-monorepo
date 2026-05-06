import { zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { veHemiAbi } from '../../../abi'
import { getPositionVotingPowerDetails } from '../../../actions/public/veHemi'
import * as constants from '../../../constants'
import { veHemiVoteDelegationAbi } from '../../../voteDelegationAbi'

vi.mock('viem/actions')

describe('getPositionVotingPowerDetails', function () {
  const mockVeHemiAddress = zeroAddress
  const mockVoteDelegationAddress = '0x1234567890123456789012345678901234567890'
  const mockOwnerAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  const anotherWallet = '0x9999999999999999999999999999999999999999'
  const mockTokenId = BigInt(1)

  it('should report not delegated away and return voting power when delegated to self', async function () {
    const mockClient = { chain: { id: 2001 } }
    const now = BigInt(Math.floor(Date.now() / 1000))
    const futureEnd = now + BigInt(86400)

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

    const result = await getPositionVotingPowerDetails({
      client: mockClient,
      ownerAddress: mockOwnerAddress,
      tokenId: mockTokenId,
    })

    expect(result.delegatee).toBe(mockOwnerAddress)
    expect(result.isDelegatedAway).toBe(false)
    expect(result.votingPower).toBe(BigInt(50000))
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

  it('should report delegated away with zero voting power when delegated to another address', async function () {
    const mockClient = { chain: { id: 2004 } }
    const now = BigInt(Math.floor(Date.now() / 1000))
    const futureEnd = now + BigInt(86400)

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

    const result = await getPositionVotingPowerDetails({
      client: mockClient,
      ownerAddress: mockOwnerAddress,
      tokenId: mockTokenId,
    })

    expect(result.delegatee).toBe(anotherWallet)
    expect(result.isDelegatedAway).toBe(true)
    expect(result.votingPower).toBe(BigInt(0))
  })

  it('should not count as delegated away and return zero voting power for expired delegation', async function () {
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

    const result = await getPositionVotingPowerDetails({
      client: mockClient,
      ownerAddress: mockOwnerAddress,
      tokenId: mockTokenId,
    })

    expect(result.delegatee).toBe(mockOwnerAddress)
    expect(result.isDelegatedAway).toBe(false)
    expect(result.votingPower).toBe(BigInt(0))
  })

  it('should throw error when client chain is not defined', async function () {
    const clientWithoutChain = { chain: undefined }

    await expect(
      getPositionVotingPowerDetails({
        client: clientWithoutChain,
        ownerAddress: mockOwnerAddress,
        tokenId: mockTokenId,
      }),
    ).rejects.toThrow('Client chain is not defined')
  })
})
