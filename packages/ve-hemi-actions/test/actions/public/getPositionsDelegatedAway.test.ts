import { zeroAddress } from 'viem'
import { multicall, readContract } from 'viem/actions'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { veHemiAbi } from '../../../abi'
import { getPositionsDelegatedAway } from '../../../actions/public/veHemi'
import * as constants from '../../../constants'
import { veHemiVoteDelegationAbi } from '../../../voteDelegationAbi'

vi.mock('viem/actions')

const CHAIN_ID_DELEGATED_AWAY = 9003

describe('getPositionsDelegatedAway', function () {
  const mockVeHemiAddress = zeroAddress
  const mockVoteDelegationAddress = '0x1234567890123456789012345678901234567890'
  const mockOwnerAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  const mockOtherAddress = '0x1111111111111111111111111111111111111111'

  afterEach(function () {
    vi.useRealTimers()
  })

  it('flags only the active delegations pointing elsewhere', async function () {
    const fixedNowMs = 1700000000000
    vi.useFakeTimers({ now: fixedNowMs })

    const now = BigInt(Math.floor(fixedNowMs / 1000))
    const mockClient = { chain: { id: CHAIN_ID_DELEGATED_AWAY } }
    const tokenIds = [BigInt(1), BigInt(2), BigInt(3)]

    const mockDelegations = [
      {
        amount: BigInt(500000),
        bias: now * BigInt(100) + BigInt(50000),
        delegatee: mockOtherAddress,
        end: now + BigInt(86400),
        slope: BigInt(100),
      },
      {
        amount: BigInt(300000),
        bias: now * BigInt(100) + BigInt(30000),
        delegatee: mockOwnerAddress,
        end: now + BigInt(86400),
        slope: BigInt(100),
      },
      {
        amount: BigInt(200000),
        bias: now * BigInt(100) + BigInt(20000),
        delegatee: mockOtherAddress,
        end: now - BigInt(1),
        slope: BigInt(100),
      },
    ]

    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(
      mockVeHemiAddress,
    )
    vi.mocked(readContract).mockResolvedValue(mockVoteDelegationAddress)
    vi.mocked(multicall).mockResolvedValue(mockDelegations)

    const result = await getPositionsDelegatedAway({
      client: mockClient,
      ownerAddress: mockOwnerAddress,
      tokenIds,
    })

    expect(result).toStrictEqual({ '1': true, '2': false, '3': false })
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

  it('ignores the delegatee casing', async function () {
    const fixedNowMs = 1700000000000
    vi.useFakeTimers({ now: fixedNowMs })

    const now = BigInt(Math.floor(fixedNowMs / 1000))
    const mockClient = { chain: { id: CHAIN_ID_DELEGATED_AWAY } }

    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(
      mockVeHemiAddress,
    )
    vi.mocked(readContract).mockResolvedValue(mockVoteDelegationAddress)
    vi.mocked(multicall).mockResolvedValue([
      {
        amount: BigInt(500000),
        bias: now * BigInt(100) + BigInt(50000),
        delegatee: mockOwnerAddress.toUpperCase().replace('0X', '0x'),
        end: now + BigInt(86400),
        slope: BigInt(100),
      },
    ])

    const result = await getPositionsDelegatedAway({
      client: mockClient,
      ownerAddress: mockOwnerAddress,
      tokenIds: [BigInt(1)],
    })

    expect(result).toStrictEqual({ '1': false })
  })

  it('does not flag a position that was never delegated', async function () {
    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(
      mockVeHemiAddress,
    )
    vi.mocked(readContract).mockResolvedValue(mockVoteDelegationAddress)
    vi.mocked(multicall).mockResolvedValue([
      {
        amount: BigInt(0),
        bias: BigInt(0),
        delegatee: zeroAddress,
        end: 0,
        slope: BigInt(0),
      },
    ])

    const result = await getPositionsDelegatedAway({
      client: { chain: { id: CHAIN_ID_DELEGATED_AWAY } },
      ownerAddress: mockOwnerAddress,
      tokenIds: [BigInt(1)],
    })

    expect(result).toStrictEqual({ '1': false })
  })

  it('handles the uint48 end decoded as a number', async function () {
    const fixedNowMs = 1700000000000
    vi.useFakeTimers({ now: fixedNowMs })

    const now = Math.floor(fixedNowMs / 1000)

    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(
      mockVeHemiAddress,
    )
    vi.mocked(readContract).mockResolvedValue(mockVoteDelegationAddress)
    vi.mocked(multicall).mockResolvedValue([
      {
        amount: BigInt(500000),
        bias: BigInt(50000),
        delegatee: mockOtherAddress,
        end: now + 86400,
        slope: BigInt(100),
      },
    ])

    const result = await getPositionsDelegatedAway({
      client: { chain: { id: CHAIN_ID_DELEGATED_AWAY } },
      ownerAddress: mockOwnerAddress,
      tokenIds: [BigInt(1)],
    })

    expect(result).toStrictEqual({ '1': true })
  })

  it('throws when multicall fails (allowFailure: false)', async function () {
    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(
      mockVeHemiAddress,
    )
    vi.mocked(readContract).mockResolvedValue(mockVoteDelegationAddress)
    vi.mocked(multicall).mockRejectedValue(new Error('Multicall reverted'))

    await expect(
      getPositionsDelegatedAway({
        client: { chain: { id: CHAIN_ID_DELEGATED_AWAY } },
        ownerAddress: mockOwnerAddress,
        tokenIds: [BigInt(1)],
      }),
    ).rejects.toThrow('Multicall reverted')
  })

  it('returns an empty record when tokenIds is empty, without calling multicall', async function () {
    const mockClient = { chain: { id: CHAIN_ID_DELEGATED_AWAY } }

    const result = await getPositionsDelegatedAway({
      client: mockClient,
      ownerAddress: mockOwnerAddress,
      tokenIds: [],
    })

    expect(result).toStrictEqual({})
    expect(multicall).not.toHaveBeenCalled()
    expect(readContract).not.toHaveBeenCalled()
  })

  it('throws when client chain is not defined', async function () {
    await expect(
      getPositionsDelegatedAway({
        client: { chain: undefined },
        ownerAddress: mockOwnerAddress,
        tokenIds: [BigInt(1)],
      }),
    ).rejects.toThrow('Client chain is not defined')
  })

  it('throws when the owner address is invalid', async function () {
    await expect(
      getPositionsDelegatedAway({
        client: { chain: { id: CHAIN_ID_DELEGATED_AWAY } },
        ownerAddress: 'not-an-address' as `0x${string}`,
        tokenIds: [BigInt(1)],
      }),
    ).rejects.toThrow('Invalid owner address')
  })
})
