import { zeroAddress } from 'viem'
import { multicall } from 'viem/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { veHemiAbi } from '../../../abi'
import { getAutoRelockStatus } from '../../../actions'
import * as constants from '../../../constants'

vi.mock('viem/actions')

describe('getAutoRelockStatus', function () {
  const client = { chain: { id: 1 } }
  const tokenIds = [514n, 30117n]

  const readFor = tokenId => [
    {
      abi: veHemiAbi,
      address: zeroAddress,
      args: [tokenId],
      functionName: 'effectiveLockEnd',
    },
    {
      abi: veHemiAbi,
      address: zeroAddress,
      args: [tokenId],
      functionName: 'isAutoRelockEnabled',
    },
  ]

  beforeEach(function () {
    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(zeroAddress)
  })

  it('should pair each position with its own two reads', async function () {
    vi.mocked(multicall).mockResolvedValue([
      1795101480n,
      true,
      1882410840n,
      false,
    ])

    const result = await getAutoRelockStatus(client, tokenIds)

    expect(result).toEqual([
      { effectiveLockEnd: 1795101480n, isAutoRelockEnabled: true },
      { effectiveLockEnd: 1882410840n, isAutoRelockEnabled: false },
    ])
    expect(multicall).toHaveBeenCalledExactlyOnceWith(client, {
      allowFailure: false,
      contracts: [...readFor(514n), ...readFor(30117n)],
    })
  })

  it('should not reach the chain when there is nothing to read', async function () {
    await expect(getAutoRelockStatus(client, [])).resolves.toEqual([])
    expect(multicall).not.toHaveBeenCalled()
  })

  it('should throw error when client chain is not defined', async function () {
    await expect(getAutoRelockStatus({}, tokenIds)).rejects.toThrow(
      'Client chain is not defined',
    )
  })
})
